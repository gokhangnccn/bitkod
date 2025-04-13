package com.gokhan.bitcode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BitCodeApplication {

	public static void main(String[] args) {
		SpringApplication.run(BitCodeApplication.class, args);
	}

}
