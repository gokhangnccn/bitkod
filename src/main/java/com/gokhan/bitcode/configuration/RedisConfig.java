package com.gokhan.bitcode.configuration;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Set;

@Configuration
@EnableCaching
public class RedisConfig implements CachingConfigurer {

    /* ---------- Basit RedisTemplate (queue ve genel işlemler için) ---------- */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    /* ---------- Cache için Jackson serializer (type info ile) ---------- */
    private GenericJackson2JsonRedisSerializer cacheSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Cache için type information ekle - complex nesnelerin doğru deserialize olması için
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        
        return new GenericJackson2JsonRedisSerializer(mapper);
    }

    /* ---------- CacheManager ---------- */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory cf) {

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(cacheSerializer()))
                .prefixCacheNameWith("bitcode:");

        // Özel TTL isteyen cache'ler
        RedisCacheConfiguration oneMinute = defaultConfig.entryTtl(Duration.ofSeconds(60));
        RedisCacheConfiguration twoMinutes = defaultConfig.entryTtl(Duration.ofMinutes(2));
        RedisCacheConfiguration thirtySec  = defaultConfig.entryTtl(Duration.ofSeconds(30));

        Set<String> cacheNames = Set.of(
                "users",
                "leaderboard",
                "userSubmissions",
                "userProblemSubs",
                "userSolved",
                "userSubStats",
                "problemSuccessSubs",
                "problems",
                "testCases",
                "problemReports",
                "rateLimits",
                "sessions",
                "adminDetailedStats"
        );

        return RedisCacheManager.builder(cf)
                .initialCacheNames(cacheNames)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("userSubmissions", oneMinute)
                .withCacheConfiguration("userProblemSubs", oneMinute)
                .withCacheConfiguration("problemSuccessSubs", twoMinutes)
                .withCacheConfiguration("userSolved", oneMinute)
                .withCacheConfiguration("userSubStats", thirtySec)
                .build();
    }
}
