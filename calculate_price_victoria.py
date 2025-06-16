import json

# Load original data
with open('./items-LASTCHANCE.json', 'r') as f:
    yvr_data = json.load(f)

# The target keys to apply markup
target_keys = [
    'GREAT PRICE WITH 10% FROM COSTCO',
    'GREAT PRICE WITH 15% FROM COSTCO2',
    'GREAT PRICE WITH 20% FROM COSTCO',
    'GREAT PRICE WITH 25% FROM COSTCO',
    'GREAT PRICE WITH 30% FROM COSTCO3',
    'GREAT PRICE WITH 40% FROM COSTCO2',
    'GREAT PRICE WITH 50% FROM COSTCO22',
]

# Apply markup based on Chinese rule
def apply_markup(price):
    if price <= 10.99:
        return round(price, 2)
    elif price >= 2001:
        return round(price + 90, 2)
    else:
        step = int((price - 11) // 10)
        return round(price + 0.5 * (step + 1), 2)

# Process and create victoria_data
victoria_data = []

for product in yvr_data:
    product_new = {}

    for key, value in product.items():
        if key in target_keys and value is not None:
            try:
                original_price = float(value)
                product_new[key] = apply_markup(original_price)
            except ValueError:
                product_new[key] = value  # Leave unchanged if not a number
        else:
            product_new[key] = value  # Leave all other fields unchanged

    victoria_data.append(product_new)

print(len(victoria_data))

# # Save to b.json
# with open('./items-LASTCHANCE_VICTORIA.json', 'w') as f:
#     json.dump(victoria_data, f, indent=2, ensure_ascii=False)
