package com.gokhan.bitcode.entity;

import com.gokhan.bitcode.enums.Difficulty;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "problems")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProblemEntity implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, unique = true, updatable = false, length = 36)
    private String uid;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String exampleInput;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String exampleOutput;

    private String createdBy;

    private LocalDateTime createdAt;

    @PrePersist
    public void generateUid() {
        if (uid == null) {
            uid = java.util.UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
