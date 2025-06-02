package com.gokhan.bitcode.configuration;

import com.gokhan.bitcode.CorsConfig;
import com.gokhan.bitcode.google.OAuth2SuccessHandler;
import com.gokhan.bitcode.service.CustomAccessDeniedHandler;
import com.gokhan.bitcode.service.CustomAuthEntryPoint;
import com.gokhan.bitcode.utils.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final CustomAuthEntryPoint customAuthEntryPoint;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CorsConfig corsConfig;


    public SecurityConfig(JwtFilter jwtFilter, CustomAccessDeniedHandler customAccessDeniedHandler, CustomAuthEntryPoint customAuthEntryPoint, OAuth2SuccessHandler oAuth2SuccessHandler, CorsConfig corsConfig) {
        this.jwtFilter = jwtFilter;
        this.accessDeniedHandler = customAccessDeniedHandler;
        this.customAuthEntryPoint = customAuthEntryPoint;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.corsConfig = corsConfig;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Açık bırakılanlar
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/oauth2/**",
                                "/login/oauth2/**",
                                "/api/problems/**",
                                "/api/submissions/**",
                                "/api/llm-feedback/**",
                                "/ws/**",
                                "/topic/**",
                                "/api/auth/test-email",
                                "/api/auth/confirm",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/reset-password/validate",
                                "/actuator/health"
                        ).permitAll()

                        // Sadece giriş yapmış kullanıcılar erişebilsin
                        .requestMatchers("/api/auth/me").authenticated()

                        // Admin API'leri sadece ADMIN rolüne izin ver
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Diğer tüm istekler
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(customAuthEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2Login(oauth -> oauth
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
