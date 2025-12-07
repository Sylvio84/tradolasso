# Specs UX - Refonte du Screener Stocks avec Watchlists

## Contexte

Le screener actuel mélange les concepts de "filtres" et "watchlists" sans distinction claire. L'utilisateur ne sait pas toujours dans quel mode il se trouve.

**Objectif** : Clarifier l'interface en distinguant 3 modes mutuellement exclusifs.

---

## Les 3 modes

| Mode | Description | Filtres | Actions disponibles |
|------|-------------|---------|---------------------|
| **Filtres libres** | Aucune watchlist sélectionnée, l'utilisateur explore avec des critères | Actifs, éditables | Créer watchlist auto, Créer watchlist manuelle |
| **Watchlist automatique** | Une watchlist auto est sélectionnée | Actifs, éditables (= critères de la watchlist) | Mettre à jour (si modifiés), Sauver comme nouvelle, Supprimer |
| **Watchlist manuelle** | Une watchlist manuelle est sélectionnée | Désactivés/grisés | Supprimer |

---

## Changements à implémenter

### 1. Indicateur de mode (nouveau)

Ajouter un indicateur visuel permanent en haut du panneau de filtres qui affiche :
- Le mode actuel (texte + couleur distinctive)
- Le nom de la watchlist si une est sélectionnée
- Le type de watchlist (automatique/manuelle) via un badge ou icône
- Un badge "MODIFIÉ" quand les filtres ont été changés par rapport à la watchlist auto d'origine

**Couleurs suggérées** (adapter au thème Ant Design) :
- Filtres libres : bleu (primary)
- Watchlist automatique : vert (success)
- Watchlist manuelle : orange (warning)

### 2. Sélecteur de watchlist (modifier l'existant)

Le dropdown de sélection de watchlist doit :
- Afficher **"Aucune (filtres libres)"** comme première option
- Cette option doit être visuellement distincte quand elle est active
- Grouper les watchlists par type : "AUTOMATIQUES" et "MANUELLES" avec des labels de section
- Afficher une icône distincte par type (ex: ⚡ pour auto, 📌 pour manuelle, ou icônes Ant Design équivalentes)

### 3. Comportement des filtres selon le mode

| Mode | Comportement des filtres |
|------|-------------------------|
| Filtres libres | État normal, tous actifs |
| Watchlist auto | Chargés avec les critères de la watchlist, éditables. Détecter les modifications. |
| Watchlist manuelle | **Désactivés** : inputs grisés, non interactifs. Afficher un message "Filtres désactivés en mode watchlist manuelle" |

### 4. Actions contextuelles (modifier l'existant)

Remplacer les boutons d'action actuels par des boutons contextuels selon le mode :

**Mode Filtres libres :**
- "Créer watchlist automatique" → ouvre modal de création avec les filtres actuels
- "Sauver en watchlist manuelle" → ouvre modal pour nommer et sauver les assets affichés

**Mode Watchlist automatique :**
- "Mettre à jour [nom]" → visible UNIQUEMENT si les filtres ont été modifiés. Met à jour la watchlist avec les nouveaux filtres.
- "Sauver comme nouvelle..." → crée une nouvelle watchlist auto avec les filtres actuels
- "Supprimer watchlist" → supprime après confirmation

**Mode Watchlist manuelle :**
- "Supprimer watchlist" → supprime après confirmation
- (Pas de bouton "Gérer les assets" - cette fonctionnalité existe dans un autre module)

### 5. Bouton Reset (modifier le comportement)

Le bouton Reset doit :
- Revenir en mode "Filtres libres"
- Désélectionner la watchlist
- Remettre tous les filtres à leurs valeurs par défaut

### 6. Transitions entre modes

```
Sélection watchlist auto    → Mode "Watchlist auto" + charger les filtres
Sélection watchlist manuelle → Mode "Watchlist manuelle" + désactiver les filtres  
Sélection "Aucune"          → Mode "Filtres libres" + garder les filtres actuels
Reset                       → Mode "Filtres libres" + réinitialiser les filtres
```

---

## Comportements détaillés

### Chargement d'une watchlist automatique

1. L'utilisateur sélectionne une watchlist auto dans le dropdown
2. Le mode passe à "Watchlist automatique"
3. Les filtres du panneau sont remplacés par les critères de la watchlist
4. Les filtres originaux sont mémorisés (pour détecter les modifications)
5. La table affiche les résultats correspondant aux critères

### Modification des filtres en mode watchlist auto

1. L'utilisateur modifie un filtre
2. Le système détecte que les filtres diffèrent de l'original
3. Un badge "MODIFIÉ" apparaît dans l'indicateur de mode
4. Le bouton "Mettre à jour [nom]" devient visible/actif

### Retour aux filtres libres depuis une watchlist

**Via "Aucune (filtres libres)" dans le dropdown :**
- Désélectionne la watchlist
- Passe en mode filtres libres
- **Garde les filtres actuels** (permet d'explorer à partir des critères d'une watchlist)

**Via Reset :**
- Désélectionne la watchlist
- Passe en mode filtres libres
- **Réinitialise tous les filtres**

---

## Ce qui NE change PAS

- La structure de la table des résultats
- Les colonnes affichées
- Le tri et la pagination
- L'API des watchlists et des filtres
- La logique de filtrage côté serveur
- Le module de gestion des assets des watchlists manuelles (existe ailleurs)

---

## Notes d'implémentation

### État local à gérer

```typescript
// Mode actuel
type ScreenerMode = 'filters' | 'auto' | 'manual';

// État nécessaire
interface ScreenerState {
  mode: ScreenerMode;
  selectedWatchlist: Watchlist | null;
  filters: FilterValues;
  originalFilters: FilterValues | null; // Pour détecter les modifications en mode auto
}

// Dérivé
const filtersModified = mode === 'auto' && originalFilters && !isEqual(filters, originalFilters);
```

### Composants Ant Design suggérés

- Indicateur de mode : `Tag` ou `Badge` avec couleur dynamique
- Dropdown watchlist : `Select` avec `OptGroup` pour les sections
- Filtres désactivés : prop `disabled` sur les `Input`, `Select`, etc.
- Badge "MODIFIÉ" : `Tag` avec couleur warning
- Boutons d'action : `Button` avec `type` et `danger` selon le contexte
- Confirmation suppression : `Modal.confirm` ou `Popconfirm`

---

## Diagramme des états

Voir le fichier `SCREENER-STATE-DIAGRAM.mermaid` pour le diagramme de transitions.
