#!/usr/bin/env python3
"""Reproduce *finite checks*, NOT theorems of Goldbach, Collatz, or twin primes.

Standard library only. For each even n in [4, bound], check whether two primes sum to n.
For Collatz, check each positive start <= bound and count the steps to 1.
"""
import argparse
import hashlib
import json
import math
import pathlib
import sys
import time

EXPECTED_AT_MILLION = {
    'bound': 1000000,
    'goldbach_evens_checked': 499999,
    'goldbach_counterexamples': [],
    'primes_through_bound': 78498,
    'twin_prime_pairs_through_bound': 8169,
    'collatz_starts_checked': 1000000,
    'collatz_unresolved_within_limit': [],
    'collatz_max_steps': 524,
    'collatz_max_steps_start': 837799,
}

def prime_sieve(bound):
    sieve = bytearray(b'\1') * (bound + 1)
    sieve[0:2] = b'\0\0'
    for p in range(2, math.isqrt(bound) + 1):
        if sieve[p]:
            sieve[p*p::p] = b'\0' * len(sieve[p*p::p])
    return sieve

def goldbach_and_twins(bound):
    sieve = prime_sieve(bound)
    primes = [i for i in range(2, bound + 1) if sieve[i]]
    fails = []
    for even in range(4, bound + 1, 2):
        if not any(sieve[even - p] for p in primes if p <= even // 2):
            fails.append(even)
    twin_pairs = sum(sieve[p + 2] for p in primes if p + 2 <= bound)
    return {'goldbach_evens_checked': (bound - 2) // 2,
            'goldbach_counterexamples': fails,
            'primes_through_bound': len(primes),
            'twin_prime_pairs_through_bound': twin_pairs}

def collatz(bound, step_limit=10000):
    memo = {1: 0}
    unresolved = []
    longest = (0, 1)
    for start in range(1, bound + 1):
        value = start
        path = []
        while value not in memo and len(path) < step_limit:
            path.append(value)
            value = 3 * value + 1 if value % 2 else value // 2
        if value not in memo:
            unresolved.append(start)
            continue
        steps = memo[value]
        for path_value in reversed(path):
            steps += 1
            memo[path_value] = steps
        if memo[start] > longest[0]:
            longest = (memo[start], start)
    return {'collatz_starts_checked': bound,
            'collatz_unresolved_within_limit': unresolved,
            'collatz_max_steps': longest[0],
            'collatz_max_steps_start': longest[1]}

def finite_result(bound):
    if bound < 4 or bound % 2:
        raise ValueError('bound must be an even integer at least four')
    result = {'bound': bound}
    result.update(goldbach_and_twins(bound))
    result.update(collatz(bound))
    return result

def negative_control():
    # A deliberately altered output MUST be rejected. This is not a proof certificate test.
    altered = dict(EXPECTED_AT_MILLION)
    altered['twin_prime_pairs_through_bound'] -= 1
    return altered != EXPECTED_AT_MILLION

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bound', type=int, default=1000000)
    parser.add_argument('--output', type=pathlib.Path)
    parser.add_argument('--expect-million', action='store_true')
    args = parser.parse_args()
    start = time.monotonic()
    data = finite_result(args.bound)
    if args.expect_million and data != EXPECTED_AT_MILLION:
        print('FAIL: expected finite 1,000,000-bound values do not match', file=sys.stderr)
        return 1
    if not negative_control():
        print('FAIL: deliberately altered values were not rejected', file=sys.stderr)
        return 1
    receipt = {'schema': 'urai-the-unknown-finite-math-r7-v1',
               'result': data,
               'research_only': True,
               'theorem_proved': False,
               'elapsed_seconds': round(time.monotonic() - start, 3),
               'python_version': sys.version.split()[0],
               'negative_control_rejected': True,
               'limitations': 'Finite enumerations do not prove any unbounded conjecture.'}
    encoded = json.dumps(receipt, sort_keys=True, indent=2) + '\n'
    if args.output:
        args.output.write_text(encoded, encoding='utf-8')
        print('RECEIPT_SHA256', hashlib.sha256(encoded.encode()).hexdigest())
    print(encoded)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
