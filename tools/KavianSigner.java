import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Arrays;
import javax.swing.JPasswordField;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JLabel;
import java.awt.GridLayout;
import java.security.KeyStore;

class KavianSigner {
    public static void main(String[] args) throws Exception {
        boolean check = args.length == 2 && args[0].equals("--check-path");
        boolean create = args.length == 4 && args[3].equals("--new-key");
        String key = new String(Base64.getDecoder().decode(args[check ? 1 : 0]), StandardCharsets.UTF_8);
        if (create && Files.exists(Path.of(key))) {
            throw new IllegalArgumentException("New key path already exists. Refusing to overwrite.");
        }
        if (!create && !Files.isRegularFile(Path.of(key))) {
            throw new IllegalArgumentException("Selected keystore is not accessible.");
        }
        if (check) {
            System.out.println("Unicode path verified.");
            return;
        }
        JPasswordField field = new JPasswordField(28);
        JPasswordField confirmation = new JPasswordField(28);
        JPanel panel = new JPanel(new GridLayout(0, 1, 4, 4));
        panel.add(new JLabel(create ? "NEW password: 12+ English letters, digits or symbols." : "Keystore password:"));
        panel.add(field);
        if (create) {
            panel.add(new JLabel("Repeat NEW password:"));
            panel.add(confirmation);
            panel.add(new JLabel("Save this password in your password manager. It is not saved by this tool."));
        }
        char[] password;
        while (true) {
            int result = JOptionPane.showConfirmDialog(null, panel,
                create ? "Kavian: create NEW release key" : "Kavian: keystore password (local only)",
                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
            if (result != JOptionPane.OK_OPTION) throw new IllegalStateException("Signing cancelled.");
            password = field.getPassword();
            char[] repeated = confirmation.getPassword();
            boolean valid = !create || (password.length >= 12 && Arrays.equals(password, repeated));
            if (create) for (char c : password) if (c < 33 || c > 126) valid = false;
            Arrays.fill(repeated, '\0');
            if (valid) break;
            Arrays.fill(password, '\0');
            JOptionPane.showMessageDialog(null, "Use 12+ English letters, digits or symbols; both entries must match.");
        }
        field.setText("");
        confirmation.setText("");
        if (create) {
            Files.createDirectories(Path.of(key).getParent());
            Path keytool = Path.of(System.getProperty("java.home"), "bin", "keytool.exe");
            ProcessBuilder process = new ProcessBuilder(keytool.toString(), "-genkeypair",
                "-keystore", key, "-storetype", "PKCS12", "-alias", "kavian-release",
                "-keyalg", "RSA", "-keysize", "3072", "-sigalg", "SHA256withRSA",
                "-validity", "10000", "-dname", "CN=Kavian Release,O=Bidrano Studio",
                "-storepass:env", "KAVIAN_NEW_KEY_PASSWORD", "-keypass:env", "KAVIAN_NEW_KEY_PASSWORD");
            process.environment().put("KAVIAN_NEW_KEY_PASSWORD", new String(password));
            Process child = process.inheritIO().start();
            process.environment().remove("KAVIAN_NEW_KEY_PASSWORD");
            if (child.waitFor() != 0) throw new IllegalStateException("New key creation failed.");
            KeyStore store = KeyStore.getInstance("PKCS12");
            try (var input = Files.newInputStream(Path.of(key))) { store.load(input, password); }
            if (store.getKey("kavian-release", password) == null) throw new IllegalStateException("New key validation failed.");
            System.out.println("New release key created and password verified.");
        }
        String[] signingArgs = {"sign", "--ks", key, "--ks-pass", "pass:" + new String(password),
            "--key-pass", "pass:" + new String(password), "--pass-encoding", "utf-8",
            "--out", args[2], args[1]};
        Arrays.fill(password, '\0');
        try {
            Class.forName("com.android.apksigner.ApkSignerTool")
                .getMethod("main", String[].class).invoke(null, (Object) signingArgs);
        } finally {
            Arrays.fill(signingArgs, null);
        }
    }
}
