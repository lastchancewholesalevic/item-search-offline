import pandas as pd
import json

df_raw = pd.read_excel('input.xlsx', header=None)

# Find the first non-empty row to use as header
for idx, row in df_raw.iterrows():
    if row.notna().any():  # Check if row has any non-empty (non-NaN) cell
        header_row = idx
        break

# Re-read the file with the correct header row
df = pd.read_excel('input.xlsx', header=header_row)

with open('./items-LASTCHANCE.json','r', encoding='utf-8') as f:
    yvr_raw_data = json.load(f)

yvr_data = {}
for yvr_raw in yvr_raw_data:
    yvr_data[yvr_raw['ITEM']] = yvr_raw

previous_items = len(yvr_data)
print("Item sanity check -- proper items in last chance json: {}, all items in last chance json: {}".format(previous_items, len(yvr_raw_data)))

# make sure the new item attribute types match original ones
# Sample structure used to infer data types
template_item = {
    "ITEM": 1806207.0,                          # float
    "DESCRIPTION": "ARTIKA AUSTIN CEILIN",     # str
    "QTY": 1.0,                                 # float
    "SELL PRICE": 199.99,                       # float
    "SALVAGE %": 30.0,                          # float
    "GREAT DEALS PRICE COST": 59.997,           # float
    "GREAT PRICE WITH 10% FROM COSTCO": 179.991,
    "GREAT PRICE WITH 15% FROM COSTCO2": 169.9915,
    "GREAT PRICE WITH 20% FROM COSTCO": 159.992,
    "GREAT PRICE WITH 25% FROM COSTCO": 149.9925,
    "GREAT PRICE WITH 30% FROM COSTCO3": 139.993,
    "GREAT PRICE WITH 40% FROM COSTCO2": 119.994,
    "GREAT PRICE WITH 50% FROM COSTCO22": 99.995,
    "Vendedor ": "WELLINGTON",                 # str
    "comments ": "PRICE CHANGED BEFORE WAS: 159.99"  # str
}

# Function to enforce correct types
def enforce_type(value, target_type):
    try:
        return target_type(value)
    except Exception:
        return target_type()  # fallback to default value of that type

# Process each row
for _, row in df.iterrows():
    item_id = enforce_type(row['ITEM'], type(template_item['ITEM']))
    description = enforce_type(row['DESCRIPTION'], type(template_item['DESCRIPTION']))
    qty = enforce_type(row['QTY'], float) or 1.0
    sell_price = enforce_type(row['EXT SELL PRICE'], float)
    salvage_pct = enforce_type(row['SALVAGE'], float)
    salvage_amount = enforce_type(row['salvage amount'], float)

    # Adjust per-unit values
    per_unit_price = sell_price / qty
    per_unit_salvage_amount = salvage_amount / qty

    def discount(price, percent):
        return round(price * (1 - percent / 100), 6)

    item_data = {
        "ITEM": item_id,
        "DESCRIPTION": description,
        "QTY": enforce_type(1.0, type(template_item['QTY'])),
        "SELL PRICE": enforce_type(per_unit_price, type(template_item['SELL PRICE'])),
        "SALVAGE %": enforce_type(salvage_pct, type(template_item['SALVAGE %'])),
        "GREAT DEALS PRICE COST": enforce_type(per_unit_salvage_amount, type(template_item['GREAT DEALS PRICE COST'])),
        "GREAT PRICE WITH 10% FROM COSTCO": enforce_type(discount(per_unit_price, 10), float),
        "GREAT PRICE WITH 15% FROM COSTCO2": enforce_type(discount(per_unit_price, 15), float),
        "GREAT PRICE WITH 20% FROM COSTCO": enforce_type(discount(per_unit_price, 20), float),
        "GREAT PRICE WITH 25% FROM COSTCO": enforce_type(discount(per_unit_price, 25), float),
        "GREAT PRICE WITH 30% FROM COSTCO3": enforce_type(discount(per_unit_price, 30), float),
        "GREAT PRICE WITH 40% FROM COSTCO2": enforce_type(discount(per_unit_price, 40), float),
        "GREAT PRICE WITH 50% FROM COSTCO22": enforce_type(discount(per_unit_price, 50), float),
        "Vendedor ": enforce_type("COSTCO", type(template_item["Vendedor "])),
        "comments ": enforce_type("", type(template_item["comments "]))
    }

    # Add or update the dict
    yvr_data[item_id] = item_data

print("New items imported.")
print("previous total items: {}, new items from excel: {}, current total items: {}, possible updated items: {}".format(previous_items, len(df), len(yvr_data), len(df) + previous_items - len(yvr_data)))

# Save to output.json
with open('./output.json', 'w') as f:
    json.dump(list(yvr_data.values()), f, indent=2, ensure_ascii=False)

df_output = pd.DataFrame(yvr_data.values())

# Save DataFrame to Excel
df_output.to_excel("output.xlsx", index=False)