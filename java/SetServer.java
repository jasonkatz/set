import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import org.json.*;

public class SetServer {

    private static int msgCount;

    public static void main(String[] args) {
        msgCount = 0;

        // Initialize java server and listen for messages
        try (
            ServerSocket server = new ServerSocket(1010);
            Socket client = server.accept();
            PrintWriter out = new PrintWriter(client.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(client.getInputStream()));
        ) {
            String inputLine, outputLine;

            // Initiate conversation with client
            outputLine = SetServer.processInput(null);
            System.out.println(outputLine);

            while ((inputLine = in.readLine()) != null) {
                outputLine = SetServer.processInput(inputLine);
                System.out.println(outputLine);

                // Send ack back to server
                String ackMessage = SetServer.generateAck(inputLine);
                out.println(ackMessage);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String processInput(String input) {
        // Parse JSON string and separate into message type and data strings
        // Note: The structure of the data string will vary based on the message type
        if (input != null) {
            JSONObject obj = new JSONObject(input);
            int msgId = obj.getInt("msgId");
            String msgType = obj.getString("msgType");
            String dataString = obj.getJSONObject("data").toString();
            return "Processed message " + msgId + ": type '" + msgType + "'";
        } else {
            return "Processed null message";
        }
    }

    public static String generateAck(String input) {
        // Assume valid input string (not null; proper JSON format)
        JSONObject obj = new JSONObject(input);
        int ackId = obj.getInt("msgId");
        JSONObject response = new JSONObject();
        response.put("msgId", msgCount++);
        response.put("msgType", "ack");
        response.put("data", new JSONObject("{ ackNum: " + ackId + " }"));
        return response.toString();
    }

}
