/**
 * Static SVG Tooth Path Definitions
 * Pre-defined tooth paths for precise, non-overlapping dental chart layout
 */

export interface ToothPathDefinition {
  fdi: string
  universal: string
  path: string
  label: string
  centerX: number
  centerY: number
}

/**
 * 32 Permanent Adult Teeth
 * Positioned in realistic U-shaped arches, touching side-by-side
 */
export const PERMANENT_TOOTH_PATHS: ToothPathDefinition[] = [
  // UPPER RIGHT QUADRANT (Q1: FDI 18-11, Universal 1-8)
  {
    fdi: "18",
    universal: "1",
    path: "M120,180 C115,160 125,145 145,145 C165,145 175,160 170,180 L165,210 C163,220 147,220 145,210 Z",
    label: "UR 3rd Molar",
    centerX: 145,
    centerY: 185
  },
  {
    fdi: "17",
    universal: "2",
    path: "M185,165 C180,145 190,130 210,130 C230,130 240,145 235,165 L230,195 C228,205 212,205 210,195 Z",
    label: "UR 2nd Molar",
    centerX: 210,
    centerY: 170
  },
  {
    fdi: "16",
    universal: "3",
    path: "M250,155 C245,135 255,120 275,120 C295,120 305,135 300,155 L295,185 C293,195 277,195 275,185 Z",
    label: "UR 1st Molar",
    centerX: 275,
    centerY: 160
  },
  {
    fdi: "15",
    universal: "4",
    path: "M315,150 C312,132 320,118 338,118 C356,118 364,132 361,150 L358,178 C357,186 343,186 341,178 Z",
    label: "UR 2nd Premolar",
    centerX: 338,
    centerY: 155
  },
  {
    fdi: "14",
    universal: "5",
    path: "M376,148 C374,130 382,116 398,116 C414,116 422,130 420,148 L418,175 C417,183 403,183 401,175 Z",
    label: "UR 1st Premolar",
    centerX: 398,
    centerY: 153
  },
  {
    fdi: "13",
    universal: "6",
    path: "M435,150 C434,133 440,120 455,118 C470,120 476,133 475,150 L473,180 C472,188 458,188 456,180 Z",
    label: "UR Canine",
    centerX: 455,
    centerY: 155
  },
  {
    fdi: "12",
    universal: "7",
    path: "M488,155 C488,140 492,128 505,128 C518,128 522,140 522,155 L521,180 C520,186 510,186 509,180 Z",
    label: "UR Lateral Incisor",
    centerX: 505,
    centerY: 160
  },
  {
    fdi: "11",
    universal: "8",
    path: "M535,160 C535,145 540,133 555,133 C570,133 575,145 575,160 L574,183 C573,189 557,189 556,183 Z",
    label: "UR Central Incisor",
    centerX: 555,
    centerY: 165
  },
  
  // UPPER LEFT QUADRANT (Q2: FDI 21-28, Universal 9-16)
  {
    fdi: "21",
    universal: "9",
    path: "M625,160 C625,145 630,133 645,133 C660,133 665,145 665,160 L664,183 C663,189 647,189 646,183 Z",
    label: "UL Central Incisor",
    centerX: 645,
    centerY: 165
  },
  {
    fdi: "22",
    universal: "10",
    path: "M678,155 C678,140 682,128 695,128 C708,128 712,140 712,155 L711,180 C710,186 696,186 695,180 Z",
    label: "UL Lateral Incisor",
    centerX: 695,
    centerY: 160
  },
  {
    fdi: "23",
    universal: "11",
    path: "M725,150 C724,133 730,120 745,118 C760,120 766,133 765,150 L763,180 C762,188 748,188 746,180 Z",
    label: "UL Canine",
    centerX: 745,
    centerY: 155
  },
  {
    fdi: "24",
    universal: "12",
    path: "M778,148 C776,130 784,116 800,116 C816,116 824,130 822,148 L820,175 C819,183 805,183 803,175 Z",
    label: "UL 1st Premolar",
    centerX: 800,
    centerY: 153
  },
  {
    fdi: "25",
    universal: "13",
    path: "M837,150 C834,132 842,118 860,118 C878,118 886,132 883,150 L880,178 C879,186 865,186 863,178 Z",
    label: "UL 2nd Premolar",
    centerX: 860,
    centerY: 155
  },
  {
    fdi: "26",
    universal: "14",
    path: "M898,155 C893,135 903,120 923,120 C943,120 953,135 948,155 L943,185 C941,195 925,195 923,185 Z",
    label: "UL 1st Molar",
    centerX: 923,
    centerY: 160
  },
  {
    fdi: "27",
    universal: "15",
    path: "M963,165 C958,145 968,130 988,130 C1008,130 1018,145 1013,165 L1008,195 C1006,205 990,205 988,195 Z",
    label: "UL 2nd Molar",
    centerX: 988,
    centerY: 170
  },
  {
    fdi: "28",
    universal: "16",
    path: "M1028,180 C1023,160 1033,145 1053,145 C1073,145 1083,160 1078,180 L1073,210 C1071,220 1055,220 1053,210 Z",
    label: "UL 3rd Molar",
    centerX: 1053,
    centerY: 185
  },
  
  // LOWER LEFT QUADRANT (Q3: FDI 31-38, Universal 17-24)
  {
    fdi: "31",
    universal: "24",
    path: "M625,600 C625,585 630,573 645,573 C660,573 665,585 665,600 L664,623 C663,629 647,629 646,623 Z",
    label: "LL Central Incisor",
    centerX: 645,
    centerY: 605
  },
  {
    fdi: "32",
    universal: "23",
    path: "M678,595 C678,580 682,568 695,568 C708,568 712,580 712,595 L711,620 C710,626 696,626 695,620 Z",
    label: "LL Lateral Incisor",
    centerX: 695,
    centerY: 600
  },
  {
    fdi: "33",
    universal: "22",
    path: "M725,590 C724,573 730,560 745,558 C760,560 766,573 765,590 L763,620 C762,628 748,628 746,620 Z",
    label: "LL Canine",
    centerX: 745,
    centerY: 595
  },
  {
    fdi: "34",
    universal: "21",
    path: "M778,588 C776,570 784,556 800,556 C816,556 824,570 822,588 L820,615 C819,623 805,623 803,615 Z",
    label: "LL 1st Premolar",
    centerX: 800,
    centerY: 593
  },
  {
    fdi: "35",
    universal: "20",
    path: "M837,590 C834,572 842,558 860,558 C878,558 886,572 883,590 L880,618 C879,626 865,626 863,618 Z",
    label: "LL 2nd Premolar",
    centerX: 860,
    centerY: 595
  },
  {
    fdi: "36",
    universal: "19",
    path: "M898,595 C893,575 903,560 923,560 C943,560 953,575 948,595 L943,625 C941,635 925,635 923,625 Z",
    label: "LL 1st Molar",
    centerX: 923,
    centerY: 600
  },
  {
    fdi: "37",
    universal: "18",
    path: "M963,605 C958,585 968,570 988,570 C1008,570 1018,585 1013,605 L1008,635 C1006,645 990,645 988,635 Z",
    label: "LL 2nd Molar",
    centerX: 988,
    centerY: 610
  },
  {
    fdi: "38",
    universal: "17",
    path: "M1028,620 C1023,600 1033,585 1053,585 C1073,585 1083,600 1078,620 L1073,650 C1071,660 1055,660 1053,650 Z",
    label: "LL 3rd Molar",
    centerX: 1053,
    centerY: 625
  },
  
  // LOWER RIGHT QUADRANT (Q4: FDI 41-48, Universal 25-32)
  {
    fdi: "41",
    universal: "25",
    path: "M575,600 C575,585 570,573 555,573 C540,573 535,585 535,600 L536,623 C537,629 553,629 554,623 Z",
    label: "LR Central Incisor",
    centerX: 555,
    centerY: 605
  },
  {
    fdi: "42",
    universal: "26",
    path: "M522,595 C522,580 518,568 505,568 C492,568 488,580 488,595 L489,620 C490,626 504,626 505,620 Z",
    label: "LR Lateral Incisor",
    centerX: 505,
    centerY: 600
  },
  {
    fdi: "43",
    universal: "27",
    path: "M475,590 C476,573 470,560 455,558 C440,560 434,573 435,590 L437,620 C438,628 452,628 454,620 Z",
    label: "LR Canine",
    centerX: 455,
    centerY: 595
  },
  {
    fdi: "44",
    universal: "28",
    path: "M422,588 C424,570 416,556 400,556 C384,556 376,570 378,588 L380,615 C381,623 395,623 397,615 Z",
    label: "LR 1st Premolar",
    centerX: 400,
    centerY: 593
  },
  {
    fdi: "45",
    universal: "29",
    path: "M363,590 C366,572 358,558 340,558 C322,558 314,572 317,590 L320,618 C321,626 335,626 337,618 Z",
    label: "LR 2nd Premolar",
    centerX: 340,
    centerY: 595
  },
  {
    fdi: "46",
    universal: "30",
    path: "M302,595 C307,575 297,560 277,560 C257,560 247,575 252,595 L257,625 C259,635 275,635 277,625 Z",
    label: "LR 1st Molar",
    centerX: 277,
    centerY: 600
  },
  {
    fdi: "47",
    universal: "31",
    path: "M237,605 C242,585 232,570 212,570 C192,570 182,585 187,605 L192,635 C194,645 210,645 212,635 Z",
    label: "LR 2nd Molar",
    centerX: 212,
    centerY: 610
  },
  {
    fdi: "48",
    universal: "32",
    path: "M172,620 C177,600 167,585 147,585 C127,585 117,600 122,620 L127,650 C129,660 145,660 147,650 Z",
    label: "LR 3rd Molar",
    centerX: 147,
    centerY: 625
  }
]

/**
 * 20 Primary (Baby) Teeth
 * Universal letters A-T
 */
export const PRIMARY_TOOTH_PATHS: ToothPathDefinition[] = [
  // UPPER RIGHT (FDI 55-51, Universal E-A)
  {
    fdi: "55",
    universal: "A",
    path: "M250,180 C245,165 253,153 270,153 C287,153 295,165 290,180 L287,205 C286,212 274,212 273,205 Z",
    label: "UR 2nd Primary Molar",
    centerX: 270,
    centerY: 183
  },
  {
    fdi: "54",
    universal: "B",
    path: "M305,175 C302,160 310,148 325,148 C340,148 348,160 345,175 L343,198 C342,205 330,205 329,198 Z",
    label: "UR 1st Primary Molar",
    centerX: 325,
    centerY: 178
  },
  {
    fdi: "53",
    universal: "C",
    path: "M360,172 C358,158 365,147 378,146 C391,147 398,158 396,172 L394,195 C393,201 383,201 382,195 Z",
    label: "UR Primary Canine",
    centerX: 378,
    centerY: 175
  },
  {
    fdi: "52",
    universal: "D",
    path: "M410,170 C409,157 415,147 428,147 C441,147 447,157 446,170 L445,190 C444,195 434,195 433,190 Z",
    label: "UR Lateral Primary Incisor",
    centerX: 428,
    centerY: 173
  },
  {
    fdi: "51",
    universal: "E",
    path: "M460,170 C460,157 465,147 478,147 C491,147 496,157 496,170 L495,190 C494,195 484,195 483,190 Z",
    label: "UR Central Primary Incisor",
    centerX: 478,
    centerY: 173
  },
  
  // UPPER LEFT (FDI 61-65, Universal F-J)
  {
    fdi: "61",
    universal: "F",
    path: "M704,170 C704,157 709,147 722,147 C735,147 740,157 740,170 L739,190 C738,195 728,195 727,190 Z",
    label: "UL Central Primary Incisor",
    centerX: 722,
    centerY: 173
  },
  {
    fdi: "62",
    universal: "G",
    path: "M754,170 C753,157 759,147 772,147 C785,147 791,157 790,170 L789,190 C788,195 778,195 777,190 Z",
    label: "UL Lateral Primary Incisor",
    centerX: 772,
    centerY: 173
  },
  {
    fdi: "63",
    universal: "H",
    path: "M804,172 C802,158 809,147 822,146 C835,147 842,158 840,172 L838,195 C837,201 823,201 822,195 Z",
    label: "UL Primary Canine",
    centerX: 822,
    centerY: 175
  },
  {
    fdi: "64",
    universal: "I",
    path: "M855,175 C852,160 860,148 875,148 C890,148 898,160 895,175 L893,198 C892,205 880,205 879,198 Z",
    label: "UL 1st Primary Molar",
    centerX: 875,
    centerY: 178
  },
  {
    fdi: "65",
    universal: "J",
    path: "M910,180 C905,165 913,153 930,153 C947,153 955,165 950,180 L947,205 C946,212 934,212 933,205 Z",
    label: "UL 2nd Primary Molar",
    centerX: 930,
    centerY: 183
  },
  
  // LOWER LEFT (FDI 71-75, Universal K-O)
  {
    fdi: "71",
    universal: "K",
    path: "M704,600 C704,585 709,573 722,573 C735,573 740,585 740,600 L739,620 C738,625 728,625 727,620 Z",
    label: "LL Central Primary Incisor",
    centerX: 722,
    centerY: 603
  },
  {
    fdi: "72",
    universal: "L",
    path: "M754,595 C753,580 759,568 772,568 C785,568 791,580 790,595 L789,615 C788,620 778,620 777,615 Z",
    label: "LL Lateral Primary Incisor",
    centerX: 772,
    centerY: 598
  },
  {
    fdi: "73",
    universal: "M",
    path: "M804,590 C802,575 809,563 822,562 C835,563 842,575 840,590 L838,613 C837,619 823,619 822,613 Z",
    label: "LL Primary Canine",
    centerX: 822,
    centerY: 593
  },
  {
    fdi: "74",
    universal: "N",
    path: "M855,585 C852,570 860,558 875,558 C890,558 898,570 895,585 L893,608 C892,615 880,615 879,608 Z",
    label: "LL 1st Primary Molar",
    centerX: 875,
    centerY: 588
  },
  {
    fdi: "75",
    universal: "O",
    path: "M910,580 C905,565 913,553 930,553 C947,553 955,565 950,580 L947,605 C946,612 934,612 933,605 Z",
    label: "LL 2nd Primary Molar",
    centerX: 930,
    centerY: 583
  },
  
  // LOWER RIGHT (FDI 81-85, Universal P-T)
  {
    fdi: "85",
    universal: "P",
    path: "M250,580 C245,565 253,553 270,553 C287,553 295,565 290,580 L287,605 C286,612 274,612 273,605 Z",
    label: "LR 2nd Primary Molar",
    centerX: 270,
    centerY: 583
  },
  {
    fdi: "84",
    universal: "Q",
    path: "M305,585 C302,570 310,558 325,558 C340,558 348,570 345,585 L343,608 C342,615 330,615 329,608 Z",
    label: "LR 1st Primary Molar",
    centerX: 325,
    centerY: 588
  },
  {
    fdi: "83",
    universal: "R",
    path: "M360,590 C358,575 365,563 378,562 C391,563 398,575 396,590 L394,613 C393,619 383,619 382,613 Z",
    label: "LR Primary Canine",
    centerX: 378,
    centerY: 593
  },
  {
    fdi: "82",
    universal: "S",
    path: "M410,595 C409,580 415,568 428,568 C441,568 447,580 446,595 L445,615 C444,620 434,620 433,615 Z",
    label: "LR Lateral Primary Incisor",
    centerX: 428,
    centerY: 598
  },
  {
    fdi: "81",
    universal: "T",
    path: "M460,600 C460,585 465,573 478,573 C491,573 496,585 496,600 L495,620 C494,625 484,625 483,620 Z",
    label: "LR Central Primary Incisor",
    centerX: 478,
    centerY: 603
  }
]
