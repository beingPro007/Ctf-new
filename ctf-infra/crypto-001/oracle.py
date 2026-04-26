#!/usr/bin/env python3
import socket, threading, json, random, sys

FLAG = "CTF{small_e_wiener_attack_rsa_broken}"

# Intentionally weak RSA: very small public exponent e=3 with no padding
# Players can use cube root attack when e=3 and m^e < n
def generate_weak_rsa():
    """Generate weak RSA params where m^3 < n (vulnerable to cube root attack)"""
    import math
    # Small, but real primes for demo purposes
    p = 104729
    q = 224759
    n = p * q
    e = 3
    phi = (p - 1) * (q - 1)
    # d = modular inverse of e mod phi
    d = pow(e, -1, phi)
    return n, e, d, p, q

def encrypt_flag(flag_bytes, e, n):
    m = int.from_bytes(flag_bytes, 'big')
    c = pow(m, e, n)
    return c

def handle_client(conn, addr):
    try:
        print(f"Accepted connection from {addr}", flush=True)
        n, e, d, p, q = generate_weak_rsa()
        flag_bytes = FLAG.encode()
        c = encrypt_flag(flag_bytes, e, n)

        banner = f"""
╔════════════════════════════════════════════╗
║      BROKEN RSA ORACLE  v0.1 (e=3)        ║
╠════════════════════════════════════════════╣
║  Public Key:                               ║
║  n = {n}                                  ║
║  e = {e}                                          ║
╠════════════════════════════════════════════╣
║  Encrypted Flag (ciphertext):              ║
║  c = {c}
╠════════════════════════════════════════════╣
║  Hint: When e is small and no padding      ║
║  is used, you can use the cube root trick! ║
║                                            ║
║  m^3 < n ? {str(int.from_bytes(flag_bytes,'big')**3 < n).upper()}                            ║
╠════════════════════════════════════════════╣
║  Commands:                                 ║
║  1) Encrypt a message                      ║
║  2) Submit decrypted flag                  ║
║  q) Quit                                   ║
╚════════════════════════════════════════════╝
""".encode()
        conn.sendall(banner)

        while True:
            conn.sendall(b"> ")
            data = conn.recv(256).decode(errors='ignore').strip()
            if not data or data.lower() == 'q':
                break
            elif data == '1':
                conn.sendall(b"Enter message (as integer): ")
                msg = conn.recv(256).decode(errors='ignore').strip()
                try:
                    m = int(msg)
                    ct = pow(m, e, n)
                    conn.sendall(f"Ciphertext: {ct}\n".encode())
                except:
                    conn.sendall(b"Invalid input.\n")
            elif data == '2':
                conn.sendall(b"Enter the decrypted flag: ")
                ans = conn.recv(256).decode(errors='ignore').strip()
                if ans == FLAG:
                    conn.sendall(f"CORRECT! Flag: {FLAG}\n".encode())
                else:
                    conn.sendall(b"Wrong! Keep trying.\n")
            else:
                conn.sendall(b"Unknown command.\n")
    except Exception as ex:
        import traceback
        traceback.print_exc()
        print(f"Error handling client: {ex}", flush=True)
    finally:
        conn.close()

def main():
    HOST, PORT = '0.0.0.0', 4002
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((HOST, PORT))
    srv.listen(10)
    print(f"[*] Crypto Oracle listening on {HOST}:{PORT}", flush=True)
    while True:
        conn, addr = srv.accept()
        t = threading.Thread(target=handle_client, args=(conn, addr), daemon=True)
        t.start()

if __name__ == '__main__':
    main()
