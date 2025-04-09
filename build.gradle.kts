plugins {
	java
	id("org.springframework.boot") version "3.4.4"
	id("io.spring.dependency-management") version "1.1.7"
	id("jacoco")
}

group = "com.gokhan"
version = "0.1.3"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-validation")

	// web + webflux (LLM ve Web Client için gerekli)
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-webflux")

	// redis
	implementation("org.springframework.boot:spring-boot-starter-data-redis")

	// web socket
	implementation("org.springframework.boot:spring-boot-starter-websocket")

	// security + jwt
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("io.jsonwebtoken:jjwt-api:0.11.5")
	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.11.5")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.11.5")

	//lombok
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")

	// postgresql
	runtimeOnly("org.postgresql:postgresql")

	//swagger ui için gerekli
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("io.projectreactor:reactor-test")
	testImplementation("org.springframework.security:spring-security-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

}

jacoco {
	toolVersion = "0.8.12"
}

tasks.jacocoTestReport {
	dependsOn(tasks.test)

	reports {
		xml.required = false
		csv.required = false
	}

}
tasks.jacocoTestCoverageVerification {
	dependsOn(tasks.jacocoTestReport)

	violationRules {
		rule {
			element = "PACKAGE"
			includes = listOf("", "")
			limit {
				minimum = "0.80".toBigDecimal()
			}
		}
	}
}

tasks.check {
	dependsOn(tasks.jacocoTestCoverageVerification)
}
tasks.withType<Test> {
	useJUnitPlatform()
}
