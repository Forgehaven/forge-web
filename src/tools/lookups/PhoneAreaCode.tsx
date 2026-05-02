import { useMemo, useState } from 'react'
import { parsePhoneNumber } from 'libphonenumber-js'

type AreaEntry = { country: string; countryCode: string; region: string }

const nanpTable: Record<string, AreaEntry> = {
  '201': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '202': { country: 'United States', countryCode: 'US', region: 'Washington, D.C.' },
  '203': { country: 'United States', countryCode: 'US', region: 'Connecticut' },
  '205': { country: 'United States', countryCode: 'US', region: 'Alabama' },
  '206': { country: 'United States', countryCode: 'US', region: 'Washington' },
  '207': { country: 'United States', countryCode: 'US', region: 'Maine' },
  '208': { country: 'United States', countryCode: 'US', region: 'Idaho' },
  '209': { country: 'United States', countryCode: 'US', region: 'California' },
  '210': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '212': { country: 'United States', countryCode: 'US', region: 'New York' },
  '213': { country: 'United States', countryCode: 'US', region: 'California' },
  '214': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '215': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '216': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '217': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '218': { country: 'United States', countryCode: 'US', region: 'Minnesota' },
  '219': { country: 'United States', countryCode: 'US', region: 'Indiana' },
  '220': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '223': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '224': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '225': { country: 'United States', countryCode: 'US', region: 'Louisiana' },
  '226': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '228': { country: 'United States', countryCode: 'US', region: 'Mississippi' },
  '229': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '231': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '234': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '236': { country: 'Canada', countryCode: 'CA', region: 'British Columbia' },
  '239': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '240': { country: 'United States', countryCode: 'US', region: 'Maryland' },
  '242': { country: 'Bahamas', countryCode: 'BS', region: 'Bahamas' },
  '246': { country: 'Barbados', countryCode: 'BB', region: 'Barbados' },
  '248': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '249': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '250': { country: 'Canada', countryCode: 'CA', region: 'British Columbia' },
  '251': { country: 'United States', countryCode: 'US', region: 'Alabama' },
  '252': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '253': { country: 'United States', countryCode: 'US', region: 'Washington' },
  '254': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '256': { country: 'United States', countryCode: 'US', region: 'Alabama' },
  '260': { country: 'United States', countryCode: 'US', region: 'Indiana' },
  '262': { country: 'United States', countryCode: 'US', region: 'Wisconsin' },
  '264': { country: 'Anguilla', countryCode: 'AI', region: 'Anguilla' },
  '267': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '268': { country: 'Antigua and Barbuda', countryCode: 'AG', region: 'Antigua and Barbuda' },
  '269': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '270': { country: 'United States', countryCode: 'US', region: 'Kentucky' },
  '272': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '276': { country: 'United States', countryCode: 'US', region: 'Virginia' },
  '281': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '284': { country: 'British Virgin Islands', countryCode: 'VG', region: 'British Virgin Islands' },
  '289': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '301': { country: 'United States', countryCode: 'US', region: 'Maryland' },
  '302': { country: 'United States', countryCode: 'US', region: 'Delaware' },
  '303': { country: 'United States', countryCode: 'US', region: 'Colorado' },
  '304': { country: 'United States', countryCode: 'US', region: 'West Virginia' },
  '305': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '306': { country: 'Canada', countryCode: 'CA', region: 'Saskatchewan' },
  '307': { country: 'United States', countryCode: 'US', region: 'Wyoming' },
  '308': { country: 'United States', countryCode: 'US', region: 'Nebraska' },
  '309': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '310': { country: 'United States', countryCode: 'US', region: 'California' },
  '312': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '313': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '314': { country: 'United States', countryCode: 'US', region: 'Missouri' },
  '315': { country: 'United States', countryCode: 'US', region: 'New York' },
  '316': { country: 'United States', countryCode: 'US', region: 'Kansas' },
  '317': { country: 'United States', countryCode: 'US', region: 'Indiana' },
  '318': { country: 'United States', countryCode: 'US', region: 'Louisiana' },
  '319': { country: 'United States', countryCode: 'US', region: 'Iowa' },
  '320': { country: 'United States', countryCode: 'US', region: 'Minnesota' },
  '321': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '323': { country: 'United States', countryCode: 'US', region: 'California' },
  '325': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '330': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '331': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '332': { country: 'United States', countryCode: 'US', region: 'New York' },
  '334': { country: 'United States', countryCode: 'US', region: 'Alabama' },
  '336': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '337': { country: 'United States', countryCode: 'US', region: 'Louisiana' },
  '339': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '340': { country: 'U.S. Virgin Islands', countryCode: 'VI', region: 'U.S. Virgin Islands' },
  '341': { country: 'United States', countryCode: 'US', region: 'California' },
  '343': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '345': { country: 'Cayman Islands', countryCode: 'KY', region: 'Cayman Islands' },
  '346': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '347': { country: 'United States', countryCode: 'US', region: 'New York' },
  '351': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '352': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '354': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '360': { country: 'United States', countryCode: 'US', region: 'Washington' },
  '361': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '364': { country: 'United States', countryCode: 'US', region: 'Kentucky' },
  '365': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '367': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '380': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '385': { country: 'United States', countryCode: 'US', region: 'Utah' },
  '386': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '401': { country: 'United States', countryCode: 'US', region: 'Rhode Island' },
  '402': { country: 'United States', countryCode: 'US', region: 'Nebraska' },
  '403': { country: 'Canada', countryCode: 'CA', region: 'Alberta' },
  '404': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '405': { country: 'United States', countryCode: 'US', region: 'Oklahoma' },
  '406': { country: 'United States', countryCode: 'US', region: 'Montana' },
  '407': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '408': { country: 'United States', countryCode: 'US', region: 'California' },
  '409': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '410': { country: 'United States', countryCode: 'US', region: 'Maryland' },
  '412': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '413': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '414': { country: 'United States', countryCode: 'US', region: 'Wisconsin' },
  '415': { country: 'United States', countryCode: 'US', region: 'California' },
  '416': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '417': { country: 'United States', countryCode: 'US', region: 'Missouri' },
  '418': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '419': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '423': { country: 'United States', countryCode: 'US', region: 'Tennessee' },
  '424': { country: 'United States', countryCode: 'US', region: 'California' },
  '425': { country: 'United States', countryCode: 'US', region: 'Washington' },
  '430': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '431': { country: 'Canada', countryCode: 'CA', region: 'Manitoba' },
  '432': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '434': { country: 'United States', countryCode: 'US', region: 'Virginia' },
  '435': { country: 'United States', countryCode: 'US', region: 'Utah' },
  '437': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '438': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '440': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '441': { country: 'Bermuda', countryCode: 'BM', region: 'Bermuda' },
  '442': { country: 'United States', countryCode: 'US', region: 'California' },
  '443': { country: 'United States', countryCode: 'US', region: 'Maryland' },
  '445': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '450': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '458': { country: 'United States', countryCode: 'US', region: 'Oregon' },
  '463': { country: 'United States', countryCode: 'US', region: 'Indiana' },
  '469': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '470': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '473': { country: 'Grenada', countryCode: 'GD', region: 'Grenada' },
  '475': { country: 'United States', countryCode: 'US', region: 'Connecticut' },
  '478': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '479': { country: 'United States', countryCode: 'US', region: 'Arkansas' },
  '480': { country: 'United States', countryCode: 'US', region: 'Arizona' },
  '484': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '501': { country: 'United States', countryCode: 'US', region: 'Arkansas' },
  '502': { country: 'United States', countryCode: 'US', region: 'Kentucky' },
  '503': { country: 'United States', countryCode: 'US', region: 'Oregon' },
  '504': { country: 'United States', countryCode: 'US', region: 'Louisiana' },
  '505': { country: 'United States', countryCode: 'US', region: 'New Mexico' },
  '506': { country: 'Canada', countryCode: 'CA', region: 'New Brunswick' },
  '507': { country: 'United States', countryCode: 'US', region: 'Minnesota' },
  '508': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '509': { country: 'United States', countryCode: 'US', region: 'Washington' },
  '510': { country: 'United States', countryCode: 'US', region: 'California' },
  '512': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '513': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '514': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '515': { country: 'United States', countryCode: 'US', region: 'Iowa' },
  '516': { country: 'United States', countryCode: 'US', region: 'New York' },
  '517': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '518': { country: 'United States', countryCode: 'US', region: 'New York' },
  '519': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '520': { country: 'United States', countryCode: 'US', region: 'Arizona' },
  '530': { country: 'United States', countryCode: 'US', region: 'California' },
  '531': { country: 'United States', countryCode: 'US', region: 'Nebraska' },
  '534': { country: 'United States', countryCode: 'US', region: 'Wisconsin' },
  '539': { country: 'United States', countryCode: 'US', region: 'Oklahoma' },
  '540': { country: 'United States', countryCode: 'US', region: 'Virginia' },
  '541': { country: 'United States', countryCode: 'US', region: 'Oregon' },
  '548': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '551': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '559': { country: 'United States', countryCode: 'US', region: 'California' },
  '561': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '562': { country: 'United States', countryCode: 'US', region: 'California' },
  '563': { country: 'United States', countryCode: 'US', region: 'Iowa' },
  '564': { country: 'United States', countryCode: 'US', region: 'Washington' },
  '567': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '570': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '571': { country: 'United States', countryCode: 'US', region: 'Virginia' },
  '573': { country: 'United States', countryCode: 'US', region: 'Missouri' },
  '574': { country: 'United States', countryCode: 'US', region: 'Indiana' },
  '575': { country: 'United States', countryCode: 'US', region: 'New Mexico' },
  '579': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '580': { country: 'United States', countryCode: 'US', region: 'Oklahoma' },
  '581': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '585': { country: 'United States', countryCode: 'US', region: 'New York' },
  '586': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '587': { country: 'Canada', countryCode: 'CA', region: 'Alberta' },
  '601': { country: 'United States', countryCode: 'US', region: 'Mississippi' },
  '602': { country: 'United States', countryCode: 'US', region: 'Arizona' },
  '603': { country: 'United States', countryCode: 'US', region: 'New Hampshire' },
  '604': { country: 'Canada', countryCode: 'CA', region: 'British Columbia' },
  '605': { country: 'United States', countryCode: 'US', region: 'South Dakota' },
  '606': { country: 'United States', countryCode: 'US', region: 'Kentucky' },
  '607': { country: 'United States', countryCode: 'US', region: 'New York' },
  '608': { country: 'United States', countryCode: 'US', region: 'Wisconsin' },
  '609': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '610': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '612': { country: 'United States', countryCode: 'US', region: 'Minnesota' },
  '613': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '614': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '615': { country: 'United States', countryCode: 'US', region: 'Tennessee' },
  '616': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '617': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '618': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '619': { country: 'United States', countryCode: 'US', region: 'California' },
  '620': { country: 'United States', countryCode: 'US', region: 'Kansas' },
  '623': { country: 'United States', countryCode: 'US', region: 'Arizona' },
  '626': { country: 'United States', countryCode: 'US', region: 'California' },
  '628': { country: 'United States', countryCode: 'US', region: 'California' },
  '629': { country: 'United States', countryCode: 'US', region: 'Tennessee' },
  '630': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '631': { country: 'United States', countryCode: 'US', region: 'New York' },
  '636': { country: 'United States', countryCode: 'US', region: 'Missouri' },
  '639': { country: 'Canada', countryCode: 'CA', region: 'Saskatchewan' },
  '640': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '641': { country: 'United States', countryCode: 'US', region: 'Iowa' },
  '646': { country: 'United States', countryCode: 'US', region: 'New York' },
  '647': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '649': { country: 'Turks and Caicos Islands', countryCode: 'TC', region: 'Turks and Caicos Islands' },
  '650': { country: 'United States', countryCode: 'US', region: 'California' },
  '651': { country: 'United States', countryCode: 'US', region: 'Minnesota' },
  '657': { country: 'United States', countryCode: 'US', region: 'California' },
  '658': { country: 'Jamaica', countryCode: 'JM', region: 'Jamaica' },
  '660': { country: 'United States', countryCode: 'US', region: 'Missouri' },
  '661': { country: 'United States', countryCode: 'US', region: 'California' },
  '662': { country: 'United States', countryCode: 'US', region: 'Mississippi' },
  '664': { country: 'Montserrat', countryCode: 'MS', region: 'Montserrat' },
  '667': { country: 'United States', countryCode: 'US', region: 'Maryland' },
  '669': { country: 'United States', countryCode: 'US', region: 'California' },
  '671': { country: 'United States', countryCode: 'US', region: 'Guam' },
  '672': { country: 'Canada', countryCode: 'CA', region: 'British Columbia' },
  '678': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '680': { country: 'United States', countryCode: 'US', region: 'New York' },
  '681': { country: 'United States', countryCode: 'US', region: 'West Virginia' },
  '682': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '683': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '701': { country: 'United States', countryCode: 'US', region: 'North Dakota' },
  '702': { country: 'United States', countryCode: 'US', region: 'Nevada' },
  '703': { country: 'United States', countryCode: 'US', region: 'Virginia' },
  '704': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '705': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '706': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '707': { country: 'United States', countryCode: 'US', region: 'California' },
  '708': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '709': { country: 'Canada', countryCode: 'CA', region: 'Newfoundland and Labrador' },
  '712': { country: 'United States', countryCode: 'US', region: 'Iowa' },
  '713': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '714': { country: 'United States', countryCode: 'US', region: 'California' },
  '715': { country: 'United States', countryCode: 'US', region: 'Wisconsin' },
  '716': { country: 'United States', countryCode: 'US', region: 'New York' },
  '717': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '718': { country: 'United States', countryCode: 'US', region: 'New York' },
  '719': { country: 'United States', countryCode: 'US', region: 'Colorado' },
  '720': { country: 'United States', countryCode: 'US', region: 'Colorado' },
  '721': { country: 'Sint Maarten', countryCode: 'SX', region: 'Sint Maarten' },
  '724': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '725': { country: 'United States', countryCode: 'US', region: 'Nevada' },
  '726': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '727': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '731': { country: 'United States', countryCode: 'US', region: 'Tennessee' },
  '732': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '734': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '737': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '740': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '743': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '747': { country: 'United States', countryCode: 'US', region: 'California' },
  '754': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '757': { country: 'United States', countryCode: 'US', region: 'Virginia' },
  '758': { country: 'Saint Lucia', countryCode: 'LC', region: 'Saint Lucia' },
  '760': { country: 'United States', countryCode: 'US', region: 'California' },
  '762': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '763': { country: 'United States', countryCode: 'US', region: 'Minnesota' },
  '765': { country: 'United States', countryCode: 'US', region: 'Indiana' },
  '769': { country: 'United States', countryCode: 'US', region: 'Mississippi' },
  '770': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '772': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '773': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '774': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '775': { country: 'United States', countryCode: 'US', region: 'Nevada' },
  '778': { country: 'Canada', countryCode: 'CA', region: 'British Columbia' },
  '779': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '780': { country: 'Canada', countryCode: 'CA', region: 'Alberta' },
  '781': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '782': { country: 'Canada', countryCode: 'CA', region: 'Nova Scotia / Prince Edward Island' },
  '784': { country: 'Saint Vincent and the Grenadines', countryCode: 'VC', region: 'Saint Vincent and the Grenadines' },
  '785': { country: 'United States', countryCode: 'US', region: 'Kansas' },
  '786': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '787': { country: 'United States', countryCode: 'US', region: 'Puerto Rico' },
  '801': { country: 'United States', countryCode: 'US', region: 'Utah' },
  '802': { country: 'United States', countryCode: 'US', region: 'Vermont' },
  '803': { country: 'United States', countryCode: 'US', region: 'South Carolina' },
  '804': { country: 'United States', countryCode: 'US', region: 'Virginia' },
  '805': { country: 'United States', countryCode: 'US', region: 'California' },
  '806': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '807': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '808': { country: 'United States', countryCode: 'US', region: 'Hawaii' },
  '810': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '812': { country: 'United States', countryCode: 'US', region: 'Indiana' },
  '813': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '814': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '815': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '816': { country: 'United States', countryCode: 'US', region: 'Missouri' },
  '817': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '818': { country: 'United States', countryCode: 'US', region: 'California' },
  '819': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '820': { country: 'United States', countryCode: 'US', region: 'California' },
  '825': { country: 'Canada', countryCode: 'CA', region: 'Alberta' },
  '828': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '830': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '831': { country: 'United States', countryCode: 'US', region: 'California' },
  '832': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '838': { country: 'United States', countryCode: 'US', region: 'New York' },
  '839': { country: 'United States', countryCode: 'US', region: 'South Carolina' },
  '843': { country: 'United States', countryCode: 'US', region: 'South Carolina' },
  '845': { country: 'United States', countryCode: 'US', region: 'New York' },
  '847': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '848': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '850': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '854': { country: 'United States', countryCode: 'US', region: 'South Carolina' },
  '856': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '857': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '858': { country: 'United States', countryCode: 'US', region: 'California' },
  '859': { country: 'United States', countryCode: 'US', region: 'Kentucky' },
  '860': { country: 'United States', countryCode: 'US', region: 'Connecticut' },
  '862': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '863': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '864': { country: 'United States', countryCode: 'US', region: 'South Carolina' },
  '865': { country: 'United States', countryCode: 'US', region: 'Tennessee' },
  '867': { country: 'Canada', countryCode: 'CA', region: 'Yukon / NWT / Nunavut' },
  '870': { country: 'United States', countryCode: 'US', region: 'Arkansas' },
  '872': { country: 'United States', countryCode: 'US', region: 'Illinois' },
  '873': { country: 'Canada', countryCode: 'CA', region: 'Quebec' },
  '876': { country: 'Jamaica', countryCode: 'JM', region: 'Jamaica' },
  '878': { country: 'United States', countryCode: 'US', region: 'Pennsylvania' },
  '901': { country: 'United States', countryCode: 'US', region: 'Tennessee' },
  '902': { country: 'Canada', countryCode: 'CA', region: 'Nova Scotia / Prince Edward Island' },
  '903': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '904': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '905': { country: 'Canada', countryCode: 'CA', region: 'Ontario' },
  '906': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '907': { country: 'United States', countryCode: 'US', region: 'Alaska' },
  '908': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '909': { country: 'United States', countryCode: 'US', region: 'California' },
  '910': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '912': { country: 'United States', countryCode: 'US', region: 'Georgia' },
  '913': { country: 'United States', countryCode: 'US', region: 'Kansas' },
  '914': { country: 'United States', countryCode: 'US', region: 'New York' },
  '915': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '916': { country: 'United States', countryCode: 'US', region: 'California' },
  '917': { country: 'United States', countryCode: 'US', region: 'New York' },
  '918': { country: 'United States', countryCode: 'US', region: 'Oklahoma' },
  '919': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '920': { country: 'United States', countryCode: 'US', region: 'Wisconsin' },
  '925': { country: 'United States', countryCode: 'US', region: 'California' },
  '928': { country: 'United States', countryCode: 'US', region: 'Arizona' },
  '929': { country: 'United States', countryCode: 'US', region: 'New York' },
  '930': { country: 'United States', countryCode: 'US', region: 'Indiana' },
  '931': { country: 'United States', countryCode: 'US', region: 'Tennessee' },
  '934': { country: 'United States', countryCode: 'US', region: 'New York' },
  '936': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '937': { country: 'United States', countryCode: 'US', region: 'Ohio' },
  '938': { country: 'United States', countryCode: 'US', region: 'Alabama' },
  '939': { country: 'United States', countryCode: 'US', region: 'Puerto Rico' },
  '940': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '941': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '945': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '947': { country: 'United States', countryCode: 'US', region: 'Michigan' },
  '949': { country: 'United States', countryCode: 'US', region: 'California' },
  '951': { country: 'United States', countryCode: 'US', region: 'California' },
  '952': { country: 'United States', countryCode: 'US', region: 'Minnesota' },
  '954': { country: 'United States', countryCode: 'US', region: 'Florida' },
  '956': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '959': { country: 'United States', countryCode: 'US', region: 'Connecticut' },
  '869': { country: 'Saint Kitts and Nevis', countryCode: 'KN', region: 'Saint Kitts and Nevis' },
  '868': { country: 'Trinidad and Tobago', countryCode: 'TT', region: 'Trinidad and Tobago' },
  '767': { country: 'Dominica', countryCode: 'DM', region: 'Dominica' },
  '809': { country: 'Dominican Republic', countryCode: 'DO', region: 'Dominican Republic' },
  '829': { country: 'Dominican Republic', countryCode: 'DO', region: 'Dominican Republic' },
  '849': { country: 'Dominican Republic', countryCode: 'DO', region: 'Dominican Republic' },
  '970': { country: 'United States', countryCode: 'US', region: 'Colorado' },
  '971': { country: 'United States', countryCode: 'US', region: 'Oregon' },
  '972': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '973': { country: 'United States', countryCode: 'US', region: 'New Jersey' },
  '978': { country: 'United States', countryCode: 'US', region: 'Massachusetts' },
  '979': { country: 'United States', countryCode: 'US', region: 'Texas' },
  '980': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '984': { country: 'United States', countryCode: 'US', region: 'North Carolina' },
  '985': { country: 'United States', countryCode: 'US', region: 'Louisiana' },
  '986': { country: 'United States', countryCode: 'US', region: 'Idaho' },
  '989': { country: 'United States', countryCode: 'US', region: 'Michigan' },
}

function countryFlag(code: string): string {
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

const typeLabel: Record<string, string> = {
  MOBILE: 'Mobile',
  FIXED_LINE: 'Fixed Line',
  FIXED_LINE_OR_MOBILE: 'Fixed / Mobile',
  TOLL_FREE: 'Toll Free',
  PREMIUM_RATE: 'Premium Rate',
  SHARED_COST: 'Shared Cost',
  VOIP: 'VoIP',
  PERSONAL_NUMBER: 'Personal Number',
  PAGER: 'Pager',
  UAN: 'UAN',
  VOICEMAIL: 'Voicemail',
  UNKNOWN: 'Unknown',
}

interface Result {
  flag: string
  country: string
  region?: string
  areaCode?: string
  isValid?: boolean
  numberType?: string
  formatted?: { national: string; international: string; e164: string }
}

function analyze(raw: string): Result | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const stripped = trimmed.replace(/[\s\-().]/g, '')
  const digits = stripped.replace(/\D/g, '')

  // Pure 3-digit NANP area code
  if (/^\d{3}$/.test(stripped)) {
    const entry = nanpTable[stripped]
    if (!entry) return null
    return { flag: countryFlag(entry.countryCode), country: entry.country, region: entry.region, areaCode: stripped }
  }

  // Determine parse string for libphonenumber-js
  let parseStr: string
  if (stripped.startsWith('+')) {
    parseStr = stripped
  } else if (digits.length === 10) {
    parseStr = '+1' + digits
  } else if (digits.length === 11 && digits.startsWith('1')) {
    parseStr = '+' + digits
  } else {
    return null
  }

  try {
    const parsed = parsePhoneNumber(parseStr)
    const cc = parsed.countryCallingCode

    if (cc === '1') {
      const nationalNum = String(parsed.nationalNumber)
      const areaCode = nationalNum.slice(0, 3)
      const entry = nanpTable[areaCode]
      return {
        flag: entry ? countryFlag(entry.countryCode) : countryFlag('US'),
        country: entry?.country ?? 'United States',
        region: entry?.region,
        areaCode,
        isValid: parsed.isValid(),
        numberType: parsed.getType(),
        formatted: {
          national: parsed.formatNational(),
          international: parsed.formatInternational(),
          e164: parsed.format('E.164'),
        },
      }
    }

    const country = parsed.country ?? ''
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
    return {
      flag: country ? countryFlag(country) : '🌐',
      country: country ? (displayNames.of(country) ?? country) : `+${cc}`,
      isValid: parsed.isValid(),
      numberType: parsed.getType(),
      formatted: {
        national: parsed.formatNational(),
        international: parsed.formatInternational(),
        e164: parsed.format('E.164'),
      },
    }
  } catch {
    return null
  }
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-[#2a2d3a] last:border-0">
      <span className="text-xs text-[#6b7280] w-28 shrink-0">{label}</span>
      <span className={`text-sm text-[#e2e4ed] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

export function PhoneAreaCode() {
  const [input, setInput] = useState('')
  const result = useMemo(() => analyze(input), [input])

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono"

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Phone Area Code</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Area code or phone number</label>
          <input
            className={inputClass}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 416  ·  212  ·  +1 416 555 0123  ·  +44 20 7946 0958"
          />
        </div>

        {input && !result && (
          <p className="text-xs text-[#6b7280]">No match — try a 3-digit NANP area code or a full number with country code (e.g. +44...).</p>
        )}

        {result && (
          <div className="bg-[#0f1117] rounded-lg px-4 pt-2 pb-1">
            <div className="flex items-center gap-3 py-3 border-b border-[#2a2d3a]">
              <span className="text-3xl leading-none">{result.flag}</span>
              <div>
                <p className="text-sm font-medium text-[#e2e4ed]">{result.country}</p>
                {result.region && <p className="text-xs text-[#9ca3af] mt-0.5">{result.region}</p>}
              </div>
            </div>

            {result.areaCode && <Row label="Area Code" value={result.areaCode} mono />}
            {result.isValid !== undefined && (
              <Row
                label="Valid"
                value={
                  <span className={result.isValid ? 'text-green-400' : 'text-red-400'}>
                    {result.isValid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                }
              />
            )}
            {result.numberType && result.numberType !== 'UNKNOWN' && (
              <Row label="Type" value={typeLabel[result.numberType] ?? result.numberType} />
            )}
            {result.formatted && (
              <>
                <Row label="National" value={result.formatted.national} mono />
                <Row label="International" value={result.formatted.international} mono />
                <Row label="E.164" value={result.formatted.e164} mono />
              </>
            )}
          </div>
        )}

        <p className="text-xs text-[#6b7280]">
          Supports NANP area codes (US, Canada, Caribbean) and international numbers with country code.
        </p>
      </div>
    </div>
  )
}
