public class Set {

    public static void main(String[] args) {
        Lobby lobby = new Lobby();
        SetServer server = new SetServer();

        server.InitializeLobby(lobby);
        server.Listen();
    }

}
