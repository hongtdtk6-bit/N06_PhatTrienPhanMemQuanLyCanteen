package utils;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class HttpUtil {

    // Đọc body JSON từ request
    public static String body(HttpExchange ex) throws IOException {
        return new String(
                ex.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
        );
    }

    // Cấu hình CORS
    public static void cors(HttpExchange ex) throws IOException {

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Origin",
                "*"
        );

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization"
        );

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS"
        );

        // Xử lý request preflight của trình duyệt
        if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
            ex.sendResponseHeaders(204, -1);
            ex.close();
        }
    }

    // Trả JSON response
    public static void send(
            HttpExchange ex,
            int status,
            Object data
    ) throws IOException {

        byte[] bytes = Json.stringify(data)
                .getBytes(StandardCharsets.UTF_8);

        ex.getResponseHeaders().set(
                "Content-Type",
                "application/json; charset=UTF-8"
        );

        // CORS
        ex.getResponseHeaders().set(
                "Access-Control-Allow-Origin",
                "*"
        );

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization"
        );

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS"
        );

        ex.sendResponseHeaders(status, bytes.length);

        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}