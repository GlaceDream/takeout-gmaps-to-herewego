Convert Google Maps address lists exported from Google Takeout in CSV format into GeoJSON files compatible with HERE WeGo.

> Do not hesitate to support Nominatim team directly on their website: https://nominatim.org/funding/.

# How to use

1. Clone this project and create an `.env` file from `.env.example`.

2. Export your Google Maps collections from [Google Takeout](https://takeout.google.com/).

    > You only need to export data from the "Saved" service.

3. Move CSV files in `data-to-convert` folder.

4. Run commands:

    ```sh
    npm install
    npm run convert
    ```

5. Get converted GeoJSON files from `converted-data` folder.

6. Import your collections on [HERE WeGo](https://wego.here.com/collections).