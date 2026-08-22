import json
import csv
import sys

def map_geojson_to_assets(input_file, output_file):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {input_file}: {e}")
        sys.exit(1)

    assets = []
    
    for feature in data.get('features', []):
        props = feature.get('properties', {})
        geom = feature.get('geometry', {})
        
        asset_id = props.get('@id', 'unknown')
        if asset_id == 'unknown':
            asset_id = str(props.get('id', 'unknown'))
        
        # Calculate a simple centroid or first coordinate for location reference
        coords = geom.get('coordinates', [])
        if coords:
            # Flatten to find first point if it's a LineString
            try:
                if geom.get('type') == 'LineString':
                    lon, lat = coords[0]
                elif geom.get('type') == 'Point':
                    lon, lat = coords
                elif geom.get('type') == 'Polygon':
                    lon, lat = coords[0][0]
                else:
                    lon, lat = coords[0][0] if isinstance(coords[0][0], float) else (0,0)
                location_coord = f"{lat:.5f},{lon:.5f}"
            except Exception:
                location_coord = "unknown"
        else:
            location_coord = "unknown"

        # Determine Importance (Mainline vs Branch)
        usage = props.get('usage', '')
        service = props.get('service', '')
        if usage == 'main' or props.get('IRrouterank'):
            asset_importance = 'mainline'
        elif usage == 'branch':
            asset_importance = 'branchline'
        elif service in ['yard', 'siding', 'spur']:
            asset_importance = service
        else:
            asset_importance = 'unknown'

        name = props.get('name', 'Unnamed Track')

        # Create Engineering Asset (Track)
        assets.append({
            'asset_id': f"ENG-{asset_id.split('/')[-1]}",
            'department': 'Engineering',
            'asset_type': 'Track',
            'location': location_coord,
            'importance': asset_importance,
            'name': name
        })

        # Create Traction Asset (OHE) if electrified
        if props.get('electrified') in ['contact_line', 'yes']:
            assets.append({
                'asset_id': f"TRC-{asset_id.split('/')[-1]}",
                'department': 'Traction',
                'asset_type': 'Overhead Equipment (OHE)',
                'location': location_coord,
                'importance': asset_importance,
                'name': name
            })
            
        # Create S&T Asset (Signals) roughly for mainlines (Mocking)
        if asset_importance == 'mainline':
            assets.append({
                'asset_id': f"SNT-{asset_id.split('/')[-1]}",
                'department': 'S&T',
                'asset_type': 'Signal / Track Circuit',
                'location': location_coord,
                'importance': asset_importance,
                'name': name
            })

    # Write to CSV
    fieldnames = ['asset_id', 'department', 'asset_type', 'location', 'importance', 'name']
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(assets)

    print(f"Successfully mapped {len(data.get('features', []))} features to {len(assets)} assets.")
    print(f"Output saved to {output_file}")

if __name__ == '__main__':
    map_geojson_to_assets('/home/deadass/Desktop/sih/rl_data/export.geojson', '/home/deadass/Desktop/sih/rl_data/mapped_assets.csv')
