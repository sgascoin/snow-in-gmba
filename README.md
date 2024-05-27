# snow in gmba 
*Work in progress* 

Google Earth Engine scripts to add various snow-related statistics to Global Mountain Biodiversity Assessment (GMBA) polygons. The scripts listed below compute a snow indicator from a public dataset and outputs the derived spatial mean, standard deviation and pixel count by polygon and hydrological year and their temporal averages over the full period.

- `snowProba.js` ([source](snowProba.js)): this script computes the mean annual "snow probability" from MOD10A1. A snow probability is the ratio of the number of snow days to the number of clear-sky days. Here the snow probability is computed by hydrological year and expressed in days per year (Fig. 1, Fig. 2). Hydrological years begin on Sep 01 (north hemisphere) or Mar 01 (south hemisphere). Output file naming: `snowProba_zminzmax_yminymax.csv` (`zmin`, `zmax`: elevation range, `ymin`, `ymax`: beginning year of the first and last hydrological year). 

- `peakSwe.js` ([source](peakSwe.js)): this script extracts the annual "peak SWE" from ERA5-Land. Peak SWE is defined as the SWE value on Apr 01 (north hemisphere) or Oct 01 (south hemisphere) and expressed in meters (Fig. 3). Output file naming: `peakSwe_yminymax.csv` (`zmin`, `zmax`: elevation range, `ymin`, `ymax`: first and last year of the period). 

- `snowMeltDate.js` ([source](snowMeltDate.js)): this script estimates the annual "snow melt-out date", SMOD (i.e. first day of no snow cover) from MOD10A1. The SMOD is defined as the first date of zero percent snow cover since Jan 01 (North hemisphere polygons) or Jun 01 (South hemisphere polygons) and expressed in days. (Fig. 4). Output file naming: `snowMeltDate_zminzmax_yminymax.csv` (`zmin`, `zmax`: elevation range, `ymin`, `ymax`: year of the period start, i.e. Jan/Jun 01). 

  The output tables can be downloaded here: [https://drive.google.com/drive/folders/1sdy7m6pqYhM-pGBwa4VFLVVuCNBzZj1I](https://drive.google.com/drive/folders/1sdy7m6pqYhM-pGBwa4VFLVVuCNBzZj1I)
  
  The mean snow probability can be visualized here: [https://sgascoin.users.earthengine.app/view/snow-in-gmba](https://sgascoin.users.earthengine.app/view/snow-in-gmba)

### Fig. 1: snow probability - all elevations

<img src="https://github.com/sgascoin/snow-in-gmba/assets/29677722/eea5a9cb-4836-49ad-877d-bbe71190482b" width="800" />

### Fig. 2: snow probability - 2000-2500 m elevation range

<img src="https://github.com/sgascoin/snow-in-gmba/assets/29677722/e9bd919d-20e9-4aec-b019-160cdd1403ba" width="800" />

### Fig. 3: peak SWE (SWE on Apr/Oct 1st) - all elevations

<img src="https://github.com/sgascoin/snow-in-gmba/assets/29677722/074788d4-6bcf-48c0-b712-feea8aeed8d2" width="800" />

### Fig. 4: Snow melt out date (days since Jan/Jun 1st) - all elevations

<img src="https://github.com/sgascoin/snow-in-gmba/assets/29677722/ee832ae4-f704-4c64-9175-bceebeaff3e0" width="800" />
<img src="https://github.com/sgascoin/snow-in-gmba/assets/29677722/dcf4b36a-c93a-4745-8060-ae16a3947c77" width="600" />

## Fig. 5: 01 April SWE in 2024 relative anomaly vs. 1991-2020 climatology from ERA5-Land

![Layout SWE 1st Apr anomaly 2024](https://github.com/sgascoin/snow-in-gmba/assets/29677722/448916e0-174b-44f3-ba55-1114ae0a2e8b)


## Note
This is a contribution to IACS joint body on mountain snow cover, working group 2 

## References 

Snethlage, M.A., Geschke, J., Spehn, E.M., Ranipeta, A., Yoccoz, N.G., Körner, Ch., Jetz, W., Fischer, M. & Urbach, D. A hierarchical inventory of the world’s mountains for global comparative mountain science. Nature Scientific Data. https://doi.org/10.1038/s41597-022-01256-y (2022).
Dataset

Snethlage, M.A., Geschke, J., Spehn, E.M., Ranipeta, A., Yoccoz, N.G., Körner, Ch., Jetz, W., Fischer, M. & Urbach, D. GMBA Mountain Inventory v2. GMBA-EarthEnv. https://doi.org/10.48601/earthenv-t9k2-1407 (2022).

Muñoz Sabater, J. (2019): ERA5-Land hourly data from 1950 to present. Copernicus Climate Change Service (C3S) Climate Data Store (CDS). https://doi.org/10.24381/cds.e2161bac. Date Accessed 04-24-2024. 

Hall, D. K. and G. A. Riggs. (2021). MODIS/Terra Snow Cover Daily L3 Global 500m SIN Grid, Version 61 [Data Set]. Boulder, Colorado USA. NASA National Snow and Ice Data Center Distributed Active Archive Center. https://doi.org/10.5067/MODIS/MOD10A1.061. Date Accessed 04-24-2024.
