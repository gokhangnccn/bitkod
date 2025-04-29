package com.gokhan.bitcode.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketMessageDTO {
    private String type;
    private String feedback;
    private Integer score;
}

