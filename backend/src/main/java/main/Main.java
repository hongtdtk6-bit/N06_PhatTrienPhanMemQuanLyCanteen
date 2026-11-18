package main;

import com.sun.net.httpserver.HttpServer;
import handler.ApiHandler;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) throws Exception {
        int port=8080;
        HttpServer server=HttpServer.create(new InetSocketAddress(port),0);
        server.createContext("/api",new ApiHandler());
        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();
        System.out.println("==============================================");
        System.out.println(" CANTEEN BACKEND - REST API");
        System.out.println(" http://localhost:"+port);
        System.out.println("==============================================");
    }
}
