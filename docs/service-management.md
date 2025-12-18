추천 폴더 구조

```
src/
  api/
    httpClient.ts
    tokenStore.ts
    users.api.ts
  services/
    users.service.ts
    users.types.ts
    errorMessage.ts
  hooks/
    useUser.ts
  test/
    msw/
      handlers.ts
      server.ts
    setupTests.ts
```

1) 토큰 저장소 추상화 (브라우저/테스트 안전)

```ts
   // src/api/tokenStore.ts
export type Tokens = {
    accessToken: string;
    refreshToken: string;
};

export interface TokenStore {
    get(): Tokens | null;

    set(tokens: Tokens): void;

    clear(): void;
}

function hasLocalStorage(): boolean {
    try {
        return typeof localStorage !== "undefined";
    } catch {
        return false;
    }
}

export function createTokenStore(key = "auth.tokens"): TokenStore {
// 테스트/런타임에서 localStorage가 없을 수도 있으니 메모리 fallback
    let memory: Tokens | null = null;

    return {
        get() {
            if (hasLocalStorage()) {
                const raw = localStorage.getItem(key);
                return raw ? (JSON.parse(raw) as Tokens) : null;
            }
            return memory;
        },
        set(tokens) {
            if (hasLocalStorage()) {
                localStorage.setItem(key, JSON.stringify(tokens));
            } else {
                memory = tokens;
            }
        },
        clear() {
            if (hasLocalStorage()) localStorage.removeItem(key);
            memory = null;
        },
    };
}
```

2) axios HttpClient: 401 → refresh → 큐잉 후 재시도 (레이스 방지)

핵심 포인트:

refresh 중에 또 401이 오면 refresh 한 번만 수행

그동안 실패한 요청들은 큐에 쌓아두고 refresh 성공 후 재시도

refresh 요청은 별도 axios 인스턴스로(무한 루프 방지)

```ts
// src/api/httpClient.ts
import axios, {AxiosError, AxiosInstance, AxiosRequestConfig} from "axios";
import type {TokenStore, Tokens} from "./tokenStore";

export type ApiError = {
    status: number;
    code?: string;
    message: string;
    details?: unknown;
};

type RefreshResponseDto = {
    accessToken: string;
    refreshToken: string;
};

function normalizeAxiosError(err: unknown): ApiError {
    const ax = err as AxiosError<any>;
    const status = ax.response?.status ?? 0;
    const payload = ax.response?.data;

    return {
        status,
        code: payload?.errorCode ?? payload?.code,
        message: payload?.message ?? ax.message ?? "Request failed",
        details: payload ?? ax.toJSON?.(),
    };
}

type Pending = {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
};

export class HttpClient {
    private readonly client: AxiosInstance;
    private readonly refreshClient: AxiosInstance;

    private isRefreshing = false;
    private pendingQueue: Pending[] = [];

    constructor(
        baseURL: string,
        private readonly tokenStore: TokenStore,
        private readonly refreshPath = "/auth/refresh"
    ) {
        this.client = axios.create({
            baseURL,
            timeout: 15_000,
            headers: {"Content-Type": "application/json"},
        });

        // refresh 전용 (인터셉터 최소화)
        this.refreshClient = axios.create({
            baseURL,
            timeout: 15_000,
            headers: {"Content-Type": "application/json"},
        });

        this.client.interceptors.request.use((config) => {
            const tokens = this.tokenStore.get();
            if (tokens?.accessToken) {
                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${tokens.accessToken}`;
            }
            return config;
        });

        this.client.interceptors.response.use(
            (res) => res,
            async (err: AxiosError) => {
                const apiErr = normalizeAxiosError(err);

                const original = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
                const is401 = apiErr.status === 401;

                // 재시도 불가 케이스
                if (!original || !is401) return Promise.reject(apiErr);

                // refresh 자체가 401이면 그대로 로그아웃 유도
                if (original.url?.includes(this.refreshPath)) {
                    this.tokenStore.clear();
                    return Promise.reject(apiErr);
                }

                // 한 요청당 1회만 재시도
                if (original._retry) return Promise.reject(apiErr);
                original._retry = true;

                // refresh 토큰 없으면 끝
                const tokens = this.tokenStore.get();
                if (!tokens?.refreshToken) {
                    this.tokenStore.clear();
                    return Promise.reject(apiErr);
                }

                // refresh 진행 중이면 큐에 넣고 결과 기다리기
                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.pendingQueue.push({resolve, reject});
                    }).then(() => this.client.request(original));
                }

                // refresh 시작
                this.isRefreshing = true;

                try {
                    const newTokens = await this.refresh(tokens.refreshToken);
                    this.tokenStore.set(newTokens);

                    // 큐 flush (성공)
                    this.pendingQueue.forEach((p) => p.resolve(true));
                    this.pendingQueue = [];

                    return this.client.request(original);
                } catch (refreshErr) {
                    const normalized = normalizeAxiosError(refreshErr);
                    this.tokenStore.clear();

                    // 큐 flush (실패)
                    this.pendingQueue.forEach((p) => p.reject(normalized));
                    this.pendingQueue = [];

                    return Promise.reject(normalized);
                } finally {
                    this.isRefreshing = false;
                }
            }
        );

    }

    private async refresh(refreshToken: string): Promise<Tokens> {
        const res = await this.refreshClient.post<RefreshResponseDto>(this.refreshPath, {
            refreshToken,
        });
        return {
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
        };
    }

    async request<T>(config: AxiosRequestConfig): Promise<T> {
        const res = await this.client.request<T>(config);
        return res.data as T;
    }
}
```

3) API 레이어 + Service 레이어 (DTO → 도메인)

```ts
// src/services/users.types.ts
export type UserDto = {
    id: string;
    name: string;
    email: string;
    createdAt: string; // ISO
};

export type User = {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
};
```

```ts
// src/api/users.api.ts
import type {UserDto} from "@/services/users.types";
import {httpClient} from "./wired"; // 아래 wired.ts에서 싱글턴 생성

export const usersApi = {
    getUser: (userId: string) =>
        httpClient.request<UserDto>({method: "GET", url: `/users/${encodeURIComponent(userId)}`}),

    listUsers: () => httpClient.request<UserDto[]>({method: "GET", url: "/users"}),

    updateUserName: (userId: string, name: string) =>
        httpClient.request<UserDto>({
            method: "PATCH",
            url: `/users/${encodeURIComponent(userId)}`,
            data: {name},
        }),
};
```

```ts
// src/services/users.service.ts
import {usersApi} from "@/api/users.api";
import type {User, UserDto} from "./users.types";

function toUser(dto: UserDto): User {
    return {
        id: dto.id,
        name: dto.name.trim(),
        email: dto.email.toLowerCase(),
        createdAt: new Date(dto.createdAt),
    };
}

export const usersService = {
    async getUser(userId: string): Promise<User> {
        return toUser(await usersApi.getUser(userId));
    },
    async listUsers(): Promise<User[]> {
        return (await usersApi.listUsers()).map(toUser);
    },
    async renameUser(userId: string, name: string): Promise<User> {
        if (!name.trim()) throw new Error("Name must not be empty");
        return toUser(await usersApi.updateUserName(userId, name));
    },
};
```

4) errorCode → UI 메시지 매핑 (토스트/인라인 공통 사용)

```ts
// src/services/errorMessage.ts
import type {ApiError} from "@/api/httpClient";

const ERROR_CODE_MESSAGE: Record<string, string> = {
    AUTH_INVALID_TOKEN: "로그인이 만료되었어요. 다시 로그인해 주세요.",
    AUTH_FORBIDDEN: "권한이 없어요.",
    USER_NOT_FOUND: "사용자를 찾을 수 없어요.",
    VALIDATION_ERROR: "입력값을 확인해 주세요.",
};

export function toUserMessage(err: unknown): string {
    const e = err as Partial<ApiError>;

    if (e.code && ERROR_CODE_MESSAGE[e.code]) return ERROR_CODE_MESSAGE[e.code];

// status 기반 fallback
    if (e.status === 0) return "네트워크 상태를 확인해 주세요.";
    if (e.status === 401) return "로그인이 필요해요.";
    if (e.status === 403) return "권한이 없어요.";
    if (e.status && e.status >= 500) return "서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";

    return e.message ?? "요청 처리 중 오류가 발생했어요.";
}
```

5) 싱글턴 wiring (의존성 한 곳에 모으기)

```ts
// src/api/wired.ts
import {HttpClient} from "./httpClient";
import {createTokenStore} from "./tokenStore";

export const tokenStore = createTokenStore();
export const httpClient = new HttpClient(import.meta.env.VITE_API_BASE_URL, tokenStore);
```

6) 테스트: MSW로 API/refresh까지 통합 (vitest)
   6-1) MSW 서버

```ts
// src/test/msw/handlers.ts
import {http, HttpResponse} from "msw";

let accessToken = "access-1";
let refreshToken = "refresh-1";
let firstUserCall401 = true;

export const handlers = [
    http.post("/auth/refresh", async ({request}) => {
        const body = (await request.json()) as { refreshToken: string };
        if (body.refreshToken !== refreshToken) {
            return HttpResponse.json({errorCode: "AUTH_INVALID_TOKEN", message: "invalid"}, {status: 401});
        }

        accessToken = "access-2";
        refreshToken = "refresh-2";
        return HttpResponse.json({accessToken, refreshToken}, {status: 200});

    }),

    http.get("/users/1", ({request}) => {
        const auth = request.headers.get("authorization");
// 첫 호출은 401로 떨어뜨려 refresh 흐름 검증
        if (firstUserCall401) {
            firstUserCall401 = false;
            return HttpResponse.json({errorCode: "AUTH_INVALID_TOKEN", message: "expired"}, {status: 401});
        }

        if (auth !== `Bearer ${accessToken}`) {
            return HttpResponse.json({errorCode: "AUTH_INVALID_TOKEN", message: "bad token"}, {status: 401});
        }

        return HttpResponse.json(
            {id: "1", name: "Alice", email: "ALICE@EXAMPLE.COM", createdAt: new Date().toISOString()},
            {status: 200}
        );

    }),
];
```

```ts
// src/test/msw/server.ts
import {setupServer} from "msw/node";
import {handlers} from "./handlers";

export const server = setupServer(...handlers);
```

6-2) vitest setup

```ts
// src/test/setupTests.ts
import {afterAll, afterEach, beforeAll} from "vitest";
import {server} from "./msw/server";

beforeAll(() => server.listen({onUnhandledRequest: "error"}));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

vitest.config.ts에 setupFiles 등록:

```ts
// vitest.config.ts
import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["src/test/setupTests.ts"],
    },
});
```

6-3) refresh + 재시도 테스트 (Service 기준)

```ts
// src/services/users.service.test.ts
import {describe, expect, it} from "vitest";
import {usersService} from "./users.service";
import {tokenStore} from "@/api/wired";

describe("usersService", () => {
    it("401이면 refresh 후 원요청을 재시도해서 성공한다", async () => {
        tokenStore.set({accessToken: "access-1", refreshToken: "refresh-1"});

        const user = await usersService.getUser("1");

        expect(user.id).toBe("1");
        expect(user.email).toBe("alice@example.com"); // 매핑 확인
        // refresh가 일어나 토큰이 갱신됐는지
        expect(tokenStore.get()?.accessToken).toBe("access-2");

    });
});
```