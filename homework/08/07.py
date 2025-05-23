def dict_to_string(d):
    items = [f"{key}:{value}" for key, value in d.items()]
    return ", ".join(items)
