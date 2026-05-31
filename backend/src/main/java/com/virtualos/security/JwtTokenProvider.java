package com.virtualos.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtTokenProvider {
    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${virtualos.jwt.secret}")
    private String jwtSecret;

    @Value("${virtualos.jwt.expiration}")
    private long jwtExpirationInMs;

    public String generateToken(String userId, String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return JWT.create()
                .withSubject(username)
                .withClaim("userId", userId)
                .withIssuedAt(now)
                .withExpiresAt(expiryDate)
                .sign(Algorithm.HMAC256(jwtSecret));
    }

    public boolean validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
            JWTVerifier verifier = JWT.require(algorithm).build();
            verifier.verify(token);
            return true;
        } catch (Exception ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        }
        return false;
    }

    public String getUsernameFromToken(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getSubject();
    }

    public String getUserIdFromToken(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getClaim("userId").asString();
    }
}
