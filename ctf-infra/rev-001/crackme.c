#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// Flag is XOR-encoded — players must reverse engineer this
// XOR key: 0x42

static const unsigned char encoded_flag[] = {
    0x01, 0x16, 0x14, 0x7a, 0x70, 0x6b, 0x03, 0x39, 0x2b, 0x26,
    0x28, 0x27, 0x3c, 0x2d, 0x2b, 0x05, 0x35, 0x2b, 0x26, 0x29,
    0x21, 0x2b, 0x2c, 0x35, 0x6a, 0x7a, 0x37, 0x37, 0x37, 0x37,
    0x00
};
// XOR key: 0x42

void print_banner() {
    printf("╔═══════════════════════════════════╗\n");
    printf("║   CRACKME v1.3  [ by h4ck3r ]    ║\n");
    printf("╚═══════════════════════════════════╝\n");
    printf("Enter the secret password: ");
}

void decode_flag(char *out) {
    int i = 0;
    while (encoded_flag[i]) {
        out[i] = encoded_flag[i] ^ 0x42;
        i++;
    }
    out[i] = '\0';
}

int check_password(const char *input) {
    // Compares against a scrambled check 
    // Actual comparison is done with the decoded flag
    char expected[64];
    decode_flag(expected);
    return strcmp(input, expected) == 0;
}

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    char input[128];
    print_banner();
    fgets(input, sizeof(input), stdin);
    // Strip newline
    input[strcspn(input, "\n")] = 0;

    if (check_password(input)) {
        char flag[64];
        decode_flag(flag);
        printf("\n[+] Access Granted!\n[+] Flag: %s\n", flag);
    } else {
        printf("\n[-] Wrong password. Reverse harder!\n");
        return 1;
    }
    return 0;
}
