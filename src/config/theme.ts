import { ThemeConfig } from "antd";

/**
 * Provence Holidays Brand Colors
 */
export const brandColors = {
  gold: "#d4a267",      // Couleur principale - backgrounds, accents
  darkGold: "#a66f2f",  // Couleur secondaire - textes, hover states
  white: "#ffffff",
  black: "#000000",
  // Variations générées pour une meilleure intégration
  lightGold: "#e8c89a",
  paleGold: "#f5e8d8",
};

/**
 * Thème principal Provence Holidays pour le mode clair
 */
export const provenceHolidaysLightTheme: ThemeConfig = {
  token: {
    // Couleur primaire - utilisée pour les boutons, liens, éléments interactifs
    colorPrimary: brandColors.gold,

    // Couleur de lien - version plus foncée pour meilleure lisibilité
    colorLink: brandColors.darkGold,
    colorLinkHover: brandColors.gold,
    colorLinkActive: brandColors.darkGold,

    // Couleurs de succès/warning/erreur - conservées standards pour clarté
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    colorInfo: brandColors.gold,

    // Backgrounds
    colorBgBase: brandColors.white,
    colorBgContainer: brandColors.white,
    colorBgElevated: brandColors.white,
    colorBgLayout: "#f5f5f5",

    // Textes
    colorTextBase: "#262626",           // Texte principal - noir doux
    colorText: "#262626",
    colorTextSecondary: "#595959",      // Texte secondaire
    colorTextTertiary: "#8c8c8c",       // Texte tertiaire
    colorTextQuaternary: "#bfbfbf",     // Texte quaternaire

    // Bordures
    colorBorder: "#d9d9d9",
    colorBorderSecondary: "#f0f0f0",

    // Typographie
    fontFamily: "'Open Sans', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontWeightStrong: 600,

    // Espacements et dimensions
    borderRadius: 6,
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
  },

  components: {
    // Typography - Utilise PHTitle component pour les titres avec EB Garamond
    Typography: {
      // La police EB Garamond pour les titres est gérée par le composant PHTitle
    },

    // Boutons
    Button: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      borderRadius: 6,
      fontSize: 14,
      fontSizeLG: 14,
      fontSizeSM: 14,
      fontWeight: 500,
      fontFamily: "'Open Sans', sans-serif",
      // Le bouton primaire utilisera automatiquement colorPrimary (gold)
      // avec du texte blanc pour le contraste
    },

    // Menu / Navigation
    Menu: {
      itemColor: "#262626",
      itemHoverColor: brandColors.darkGold,
      itemSelectedColor: brandColors.darkGold,
      itemSelectedBg: brandColors.paleGold,
      itemActiveBg: brandColors.paleGold,
    },

    // Layout (sidebar, header)
    Layout: {
      siderBg: brandColors.white,
      headerBg: brandColors.white,
      bodyBg: "#f5f5f5",
      triggerBg: brandColors.gold,
      triggerColor: brandColors.white,
    },

    // Tables
    Table: {
      headerBg: "#fafafa",
      headerColor: "#262626",
      rowHoverBg: brandColors.paleGold,
    },

    // Cards
    Card: {
      headerBg: "transparent",
      actionsLiMargin: "12px 0",
    },

    // Inputs
    Input: {
      controlHeight: 36,
      borderRadius: 6,
      hoverBorderColor: brandColors.gold,
      activeBorderColor: brandColors.gold,
    },

    // Select
    Select: {
      controlHeight: 36,
      borderRadius: 6,
    },

    // Badges et Tags
    Badge: {
      // Les badges utiliseront les couleurs primaires par défaut
    },

    Tag: {
      defaultBg: brandColors.paleGold,
      defaultColor: brandColors.darkGold,
    },

    // Slider - Meilleur contraste pour les curseurs
    Slider: {
      trackBg: brandColors.gold,
      trackHoverBg: brandColors.darkGold,
      railBg: "#d9d9d9",
      railHoverBg: "#bfbfbf",
      handleColor: brandColors.gold,
      handleActiveColor: brandColors.darkGold,
      handleSize: 12,
      railSize: 6,
      dotSize: 10,
      dotBorderColor: "#d9d9d9",
      dotActiveBorderColor: brandColors.gold,
    },
  },
};

/**
 * Thème pour le mode sombre
 */
export const provenceHolidaysDarkTheme: ThemeConfig = {
  token: {
    // Couleurs primaires adaptées au mode sombre
    colorPrimary: brandColors.gold,
    colorLink: brandColors.lightGold,
    colorLinkHover: brandColors.gold,
    colorLinkActive: brandColors.darkGold,

    // Les autres tokens seront gérés par l'algorithme dark d'Ant Design
    // mais on peut les surcharger ici si nécessaire

    // Typographie (même que le mode clair)
    fontFamily: "'Open Sans', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontWeightStrong: 600,

    borderRadius: 6,
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
  },

  components: {
    // Typography - Utilise PHTitle component pour les titres avec EB Garamond
    Typography: {
      // La police EB Garamond pour les titres est gérée par le composant PHTitle
    },

    Button: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      borderRadius: 6,
      fontSize: 14,
      fontSizeLG: 14,
      fontSizeSM: 14,
      fontWeight: 500,
      fontFamily: "'Open Sans', sans-serif",
    },

    Menu: {
      itemSelectedColor: brandColors.lightGold,
      itemHoverColor: brandColors.lightGold,
    },

    Layout: {
      triggerBg: brandColors.darkGold,
    },

    Input: {
      controlHeight: 36,
      borderRadius: 6,
    },

    Select: {
      controlHeight: 36,
      borderRadius: 6,
    },

    // Slider - Mode sombre (même config que mode clair pour la cohérence)
    Slider: {
      trackBg: brandColors.gold,
      trackHoverBg: brandColors.lightGold,
      railBg: "#434343",
      railHoverBg: "#595959",
      handleColor: brandColors.gold,
      handleActiveColor: brandColors.lightGold,
      handleSize: 12,
      railSize: 6,
      dotSize: 10,
      dotBorderColor: "#434343",
      dotActiveBorderColor: brandColors.gold,
    },
  },
};
