## 1. Create a GitHub Secret

In your GitHub repository, go to Settings > Secrets and variables > Actions and create a new secret
with the following details:

1. In the Name field, enter `SONAR_TOKEN`
2. In the Value field, enter ``

## 2. Create or update a build file

### For Gradle

Update your `build.gradle` file with the `org.sonarqube` plugin and its configuration:

```groovy
plugins {
    id "org.sonarqube" version "7.1.0.6387"
}
sonar {
    properties {
        property "sonar.projectKey", "wellkorea-erp-backend"
        property "sonar.organization", "donghwunline"
    }
}
```

---

Create or update your `.github/workflows/build.yml`
Here is a base configuration to run a SonarQube Cloud analysis on your master branch and Pull Requests. If you already
have some GitHub Actions, you might want to just add some of these new steps to an existing one.

```yaml
name: SonarQube
on:
  push:
    branches:
      - main
  pull_request:
    types: [ opened, synchronize, reopened ]
jobs:
  build:
    name: Build and analyze
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Shallow clones should be disabled for a better relevancy of analysis
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: 17
          distribution: 'zulu' # Alternative distribution options are available
      - name: Cache SonarQube packages
        uses: actions/cache@v4
        with:
          path: ~/.sonar/cache
          key: ${{ runner.os }}-sonar
          restore-keys: ${{ runner.os }}-sonar
      - name: Cache Gradle packages
        uses: actions/cache@v4
        with:
          path: ~/.gradle/caches
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle') }}
          restore-keys: ${{ runner.os }}-gradle
      - name: Build and analyze
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        run: ./gradlew build sonar --info
```

---

### For JS/TS & Web

Create or update your `.github/workflows/build.yml`
Here is a base configuration to run a SonarQube Cloud analysis on your master branch and Pull Requests. If you already
have some GitHub Actions, you might want to just add some of these new steps to an existing one.

```yaml
name: Build
on:
  push:
    branches:
      - main
  pull_request:
    types: [ opened, synchronize, reopened ]
jobs:
  sonarqube:
    name: SonarQube
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Shallow clones should be disabled for a better relevancy of analysis
      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@v6
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

Create a `sonar-project.properties` file

Create a configuration file in the root directory of the project and name it `sonar-project.properties`

```properties
sonar.projectKey=wellkorea-erp-backend
sonar.organization=donghwunline


# This is the name and version displayed in the SonarCloud UI.
#sonar.projectName=wellkorea-erp-backend
#sonar.projectVersion=1.0


# Path is relative to the sonar-project.properties file. Replace "\" by "/" on Windows.
#sonar.sources=.

# Encoding of the source code. Default is default system encoding
#sonar.sourceEncoding=UTF-8
```