# 1. Derleme aşaması
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /workspace
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew clean build -x test

# 2. Uygulama aşaması
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /workspace/build/libs/bitcode-0.2.1.jar  app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]