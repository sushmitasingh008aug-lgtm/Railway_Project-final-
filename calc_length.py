import json
import math

def haversine(lon1, lat1, lon2, lat2):
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371 # Radius of earth in kilometers
    return c * r

def calculate_lengths(geojson_file):
    with open(geojson_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    total_length_km = 0
    mainline_length = 0
    yard_length = 0
    
    for feature in data.get('features', []):
        geom = feature.get('geometry', {})
        props = feature.get('properties', {})
        
        if geom.get('type') == 'LineString':
            coords = geom.get('coordinates', [])
            segment_length = 0
            for i in range(len(coords) - 1):
                lon1, lat1 = coords[i]
                lon2, lat2 = coords[i+1]
                segment_length += haversine(lon1, lat1, lon2, lat2)
                
            total_length_km += segment_length
            
            usage = props.get('usage', '')
            service = props.get('service', '')
            if usage == 'main' or props.get('IRrouterank'):
                mainline_length += segment_length
            elif service in ['yard', 'siding', 'spur']:
                yard_length += segment_length

    print(f"Total Track Length: {total_length_km:.2f} km")
    print(f"Mainline Length: {mainline_length:.2f} km")
    print(f"Yard/Siding Length: {yard_length:.2f} km")

if __name__ == '__main__':
    calculate_lengths('/home/deadass/Desktop/sih/rl_data/export.geojson')
