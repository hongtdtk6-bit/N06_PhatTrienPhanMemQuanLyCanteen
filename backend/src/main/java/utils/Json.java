package utils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.time.LocalDateTime;

public class Json {

    private static final Gson GSON = new GsonBuilder()
            .serializeNulls()
            .registerTypeAdapter(
                    LocalDateTime.class,
                    new LocalDateTimeAdapter()
            )
            .create();

    public static String stringify(Object object) {
        return GSON.toJson(object);
    }

    public static <T> T parse(String json, Class<T> clazz) {
        return GSON.fromJson(json, clazz);
    }
}