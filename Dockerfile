# Build stage: JDK 21 + Gradle wrapper
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar --no-daemon

# Runtime stage: slim JRE only
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/music-library-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Duser.timezone=UTC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
