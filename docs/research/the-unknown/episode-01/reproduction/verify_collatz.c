/* Independent direct-step finite Collatz check (not a proof). */
#include <stdint.h>
#include <stdio.h>
#define LIMIT 1000000u
#define MAX_STEPS 10000u
int main(void) {
    unsigned int longest_steps = 0, longest_start = 0;
    unsigned int unresolved = 0;
    for (uint64_t start = 1; start <= LIMIT; ++start) {
        uint64_t n = start;
        unsigned int steps = 0;
        while (n != 1 && steps < MAX_STEPS) {
            if ((n & 1u) && n > (UINT64_MAX - 1u)/3u) {
                ++unresolved; break;
            }
            n = (n & 1u) ? 3u*n + 1u : n/2u;
            ++steps;
        }
        if (n != 1) { if (steps >= MAX_STEPS) ++unresolved; continue; }
        if (steps > longest_steps) { longest_steps = steps; longest_start = (unsigned int)start; }
    }
    printf("Independent C finite Collatz check: starts=%u unresolved=%u max_steps=%u start=%u\n",
           LIMIT, unresolved, longest_steps, longest_start);
    return (unresolved == 0 && longest_steps == 524 && longest_start == 837799) ? 0 : 1;
}
