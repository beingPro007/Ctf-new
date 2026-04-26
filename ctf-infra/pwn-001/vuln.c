#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

// The flag is stored in a separate file /flag.txt
// Player must overflow the buffer to call win()

void win() {
    char flag[128];
    FILE *f = fopen("/flag.txt", "r");
    if (!f) {
        puts("Error: flag file not found.");
        exit(1);
    }
    fgets(flag, sizeof(flag), f);
    fclose(f);
    printf("Congratulations! Here is your flag:\n%s\n", flag);
}

void vuln() {
    char buf[64];
    printf("Enter your name: ");
    fflush(stdout);
    gets(buf);  // Intentionally unsafe
    printf("Hello, %s!\n", buf);
}

int main() {
    setbuf(stdout, NULL);
    setbuf(stdin, NULL);
    printf("=== Welcome to the Stack Server ===\n");
    printf("Win function address: %p\n", win);
    vuln();
    return 0;
}
