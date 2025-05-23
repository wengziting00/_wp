def classify_even_odd(numbers):
    result = {
        'even': [],
        'odd': []
    }
    for num in numbers:
        if num % 2 == 0:
            result['even'].append(num)
        else:
            result['odd'].append(num)
    return result
