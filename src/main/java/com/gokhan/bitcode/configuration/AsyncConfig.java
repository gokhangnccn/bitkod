package com.gokhan.bitcode.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "codeRunnerExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);         // minimum eş zamanlı çalışan thread
        executor.setMaxPoolSize(10);         // maksimum eş zamanlı thread
        executor.setQueueCapacity(100);      // bekleme kuyruğu
        executor.setThreadNamePrefix("CodeRunner-");
        executor.initialize();
        return executor;
    }
}
