import unittest
from verify_finite_math import prime_sieve, finite_result, negative_control

class Checks(unittest.TestCase):
    def test_sieve_known(self):
        primes = [i for i, is_prime in enumerate(prime_sieve(30)) if is_prime]
        self.assertEqual(primes, [2,3,5,7,11,13,17,19,23,29])
    def test_small_bound(self):
        result=finite_result(20)
        self.assertEqual(result['goldbach_evens_checked'], 9)
        self.assertEqual(result['goldbach_counterexamples'], [])
        self.assertEqual(result['twin_prime_pairs_through_bound'], 4)
    def test_negative_control(self):
        self.assertTrue(negative_control())
    def test_no_non_even_bound(self):
        with self.assertRaises(ValueError):
            finite_result(19)

if __name__ == '__main__':
    unittest.main()
