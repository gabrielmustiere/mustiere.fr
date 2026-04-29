# Évolutions majeures de PHP — version par version (7.0 à 8.5)

## TL;DR
- De PHP 7.0 (décembre 2015) à PHP 8.5 (novembre 2025), le langage est passé d'un script faiblement typé à un langage moderne doté d'un système de types riche (types scalaires, union, intersection, DNF, enums, types nullable, never, readonly), d'une orientation objet aboutie (constructor promotion, propriétés en lecture seule, hooks de propriétés, visibilité asymétrique, classes readonly) et d'outils de méta-programmation natifs (attributes, fibers, lazy objects).
- Côté performance, deux ruptures structurelles : le moteur Zend Engine 3 issu du projet phpng en PHP 7.0 (gain ≈ 2× vs PHP 5.6) puis le compilateur JIT introduit en PHP 8.0 et refondu sur le framework IR en PHP 8.4, complétés par le preloading (7.4), l'inheritance cache (8.1) et l'OPcache désormais toujours compilé statiquement (8.5).
- Sur la même période, PHP a aussi modernisé son écosystème (libsodium et Argon2 en 7.2, FFI en 7.4), nettoyé son héritage (suppression de mcrypt, des constructeurs PHP 4, des propriétés dynamiques, des callables partiellement supportés) et modélisé son cycle de vie autour d'une cadence annuelle prévisible.

## Key Findings
- PHP 7.0 et PHP 8.0 sont les deux jalons de rupture (moteur Zend 3, puis JIT et système de types modernisé).
- PHP 7.4, 8.1 et 8.4 sont les versions « mineures » les plus riches en nouvelles fonctionnalités majeures (typed properties + arrow functions + FFI + preloading ; enums + readonly + fibers ; property hooks + visibilité asymétrique + nouveau JIT IR).
- Les déprécations majeures qui ont façonné le PHP moderne : constructeurs PHP 4 (7.0), each()/__autoload() (7.2), mcrypt (7.2), case-insensitive constants (7.3), partially supported callables et utf8_encode/decode (8.2), propriétés dynamiques (8.2 → suppression prévue en 9.0), implicit nullable params (8.4), backtick operator alias et noms de cast non canoniques (8.5).

## Details

---

### PHP 7.0 — 3 décembre 2015

**Moteur et performance**
- Nouveau moteur **Zend Engine 3** (issu du projet phpng de Dmitry Stogov, Xinchen Hui et Nikita Popov). Saut de performance massif : environ **2× plus rapide** que PHP 5.6 et **~50 % de mémoire en moins** sur des charges typiques (WordPress, Drupal, Magento). Tumblr et d'autres acteurs ont publiquement rapporté des baisses de latence et de charge CPU de l'ordre de 50 %.
- Refonte des structures internes (zval, hashtable) ouvrant la voie au futur JIT.
- Nouveau Abstract Syntax Tree (AST) intermédiaire dans la compilation.

**Système de types**
- **Scalar type declarations** sur les paramètres : `int`, `float`, `string`, `bool` (mode coercitif par défaut, mode strict via `declare(strict_types=1);`).
- **Return type declarations** : possibilité de typer la valeur de retour des fonctions et méthodes.

**Syntaxe et OOP**
- **Opérateur de coalescence des nuls `??`** (alternative concise à `isset() ? : ...`).
- **Opérateur spaceship `<=>`** pour la comparaison combinée (-1 / 0 / 1).
- **Classes anonymes** (`new class { ... }`).
- **Group use declarations** pour factoriser les imports d'un même namespace.
- **Constantes scalaires de type tableau** via `define()`.
- **Uniform variable syntax** (évaluation gauche-à-droite cohérente).
- **Generator delegation** (`yield from`) et **return expressions dans les générateurs**.
- **`Closure::call()`** pour lier dynamiquement et invoquer une closure.
- Échappement Unicode `\u{xxxx}` dans les chaînes à double quote.

**Gestion d'erreurs**
- Nouvelle hiérarchie d'exceptions : interface **`Throwable`** racine, classes `Error`, `TypeError`, `ParseError`, `ArithmeticError`, `DivisionByZeroError`. Les erreurs fatales recouvrables deviennent des exceptions attrapables.

**Fonctions et sécurité**
- **CSPRNG** standardisé : `random_bytes()`, `random_int()`.
- `intdiv()`, `preg_replace_callback_array()`, `IntlChar`.
- `unserialize()` accepte une whitelist de classes via le paramètre `allowed_classes`.

**Suppressions / déprécations marquantes**
- **Suppression des constructeurs « à l'ancienne » de style PHP 4** (méthode portant le nom de la classe).
- Suppression de `ext/mysql` (l'extension `mysql_*`), de l'ASP-tags `<%`, et de plusieurs SAPI obsolètes.
- Suppression du support de PHP pour HHVM comme cible alternative qui devient inutile (PHP 7 rattrape puis dépasse HHVM).

---

### PHP 7.1 — 1ᵉʳ décembre 2016

**Système de types**
- **Types nullable** avec préfixe `?` (`?string`, `?int`).
- Nouveau type de retour **`void`**.
- Nouveau pseudo-type **`iterable`** (tableau ou objet `Traversable`), utilisable en paramètre comme en retour.
- **Covariance / contravariance partielle** (notamment pour `iterable`).

**Syntaxe et OOP**
- **Visibilité des constantes de classe** (`public`, `protected`, `private`).
- **Multi-catch d'exceptions** dans un même bloc (`catch (TypeA | TypeB $e)`).
- **Destructuration courte** des tableaux avec `[$a, $b] = ...` (alternative à `list()`).
- Support des clés dans `list()` et la destructuration.
- **`Closure::fromCallable()`** pour construire une closure typée à partir d'un callable.

**Erreurs**
- Conversion d'une partie des warnings en exceptions (par ex. `Too few arguments to function` devient une `ArgumentCountError`).

**Performance**
- Optimisations supplémentaires du moteur (handlers d'opcodes spécifiques au type, infrastructure SSA pour l'optimisation), gains autour de **+10 % vs PHP 7.0**.

---

### PHP 7.2 — 30 novembre 2017

**Système de types et OOP**
- Nouveau type **`object`** utilisable en paramètre et retour.
- Possibilité d'**élargir le type d'un paramètre** lors de la surcharge d'une méthode (parameter type widening).
- Possibilité de **surcharger une méthode abstraite par une autre méthode abstraite** dans une classe enfant.

**Sécurité (avancée majeure)**
- Support natif de **Argon2i** dans `password_hash()` et `password_verify()` (algorithme vainqueur de la Password Hashing Competition 2015).
- Intégration de **libsodium** dans le cœur de PHP (extension `Sodium`) : chiffrement, signatures, dérivation de clés. PHP devient l'un des premiers grands langages à embarquer une crypto moderne dans sa bibliothèque standard.

**Suppressions / déprécations marquantes**
- **Suppression de l'extension `mcrypt`** (libmcrypt non maintenue depuis 2007), reléguée à PECL.
- **Dépréciation de `each()`**, de `__autoload()` (au profit de `spl_autoload_register()`), et de `create_function()`.
- Dépréciation de `$php_errormsg` (au profit de `error_get_last()` / `error_clear_last()`).

**Performance**
- Gains supplémentaires : ~+10 à +13 % vs 7.1 selon les benchmarks officiels (WordPress, Drupal, Magento).

---

### PHP 7.3 — 6 décembre 2018

**Syntaxe**
- **Heredoc / Nowdoc flexibles** : indentation autorisée du marqueur fermant ; le whitespace de tête est automatiquement supprimé. Première vraie modernisation de cette syntaxe depuis PHP 5.3.
- **Trailing comma autorisée dans les appels de fonction** (et méthodes) — pas dans les déclarations.
- **Références dans `list()`** (destructuration par référence).

**Fonctions utilitaires**
- `is_countable()` (pour pallier la dépréciation par PHP 7.2 de `count()` sur des valeurs non comptables).
- `array_key_first()`, `array_key_last()`.
- Drapeau **`JSON_THROW_ON_ERROR`** (et exception `JsonException`) sur `json_encode()` / `json_decode()`.
- `hrtime()` (timer haute résolution monotone).
- Migration de PCRE vers **PCRE2**.

**Sécurité**
- Support de l'attribut **SameSite** sur les cookies via `setcookie()`.
- Argon2id introduit aux côtés d'Argon2i pour `password_hash()`.

**Déprécations**
- **Constantes case-insensitive** dépréciées.
- `image2wbmp()`, plusieurs flags de `FILTER_VALIDATE_URL`.
- Plusieurs alias de fonctions hérités.

---

### PHP 7.4 — 28 novembre 2019

Souvent qualifiée de « version la plus excitante depuis PHP 7.0 ».

**Système de types et OOP**
- **Typed properties** (propriétés de classe typées). Toutes les déclarations de types sont autorisées sauf `void` et `callable`.
- **Variance complète** : retours covariants et paramètres contravariants entièrement supportés (avec autoload).

**Syntaxe**
- **Arrow functions / short closures** : `fn($x) => $x * 2`, avec capture par valeur implicite du scope parent.
- **Opérateur d'affectation null-coalescing** `??=`.
- **Spread operator dans les littéraux de tableau** (`[...$array]`).
- **Numeric literal separator** (underscore : `1_000_000`).
- Améliorations de la sérialisation (`__serialize()` / `__unserialize()` qui remplaceront à terme `__sleep`/`__wakeup`).

**Performance et bas niveau**
- **Preloading** (via `opcache.preload`) : chargement et linkage permanent de fichiers PHP au démarrage du serveur, déjà compilés en mémoire partagée.
- **FFI (Foreign Function Interface)** : appel direct de bibliothèques C depuis du code PHP utilisateur, en partie pour faciliter le prototypage d'extensions.
- **Cache opcache préfetché** et amélioration des liens entre classes.

**Nouveautés diverses**
- Classe `WeakReference` (références faibles natives).
- API de réflexion des références (`ReflectionReference`).
- `mb_str_split()`, hash CRC32C, filtre `IMG_FILTER_SCATTER`.

**Déprécations**
- Short open tags `<?` dépréciés.
- Conversions implicites string → nombre, ternaires non parenthésés `a ? b : c ? d : e`.

---

### PHP 8.0 — 26 novembre 2020

Saut majeur, comparable à 7.0 sur le plan du langage.

**Performance**
- Introduction du **JIT (Just-In-Time)** intégré à OPcache, en deux modes : **Function JIT** et **Tracing JIT**. Gains très importants sur le code CPU-intensif (synthétiques jusqu'à ~3× ; code applicatif IO-bound proche de 7.4). Pose la base pour étendre PHP au-delà du web.
- Moteur Zend renommé **Zend Engine 4**.

**Système de types**
- **Union types** natifs (`int|float`, `MyClass|null`).
- Nouveau type **`mixed`** (équivalent de « tout sauf void »).
- Nouveau type de retour **`static`** (return type covariant).
- `false` et `null` autorisés comme types secondaires d'unions.

**Syntaxe et OOP**
- **Named arguments** (arguments nommés, ordre indépendant, sauts d'arguments par défaut).
- **Attributes** natifs (`#[Attribute]`), remplaçant les annotations docblock pour les métadonnées structurées.
- **Constructor property promotion** (déclaration et affectation des propriétés directement dans la signature du constructeur).
- **Match expression** (`match(...) { }`) : expression, comparaison stricte, retour de valeur, pas de fallthrough.
- **Nullsafe operator `?->`** pour chaîner sans vérification null intermédiaire.
- **`throw` devient une expression** (utilisable en arrow function, `??`, ternaire).
- `::class` utilisable sur des objets (pas seulement des noms de classes).
- **Non-capturing catches** (`catch (Exception)` sans variable).
- **Trailing comma** dans les listes de paramètres.

**Gestion d'erreurs et cohérence**
- Nombreuses warnings reclassifiées en `Error`/`TypeError`/`ValueError` (notamment pour les fonctions internes).
- Comparaisons string/number plus saines : `0 == "foo"` renvoie désormais `false`.
- Tri stable garanti pour toutes les fonctions de tri.
- L'opérateur `@` ne masque plus les erreurs fatales.

**Nouveautés diverses**
- `WeakMap`, interface `Stringable` (auto-implémentée), `str_contains()`, `str_starts_with()`, `str_ends_with()`, `get_debug_type()`, `fdiv()`, `get_resource_id()`.
- Méthodes abstraites dans les traits.
- Réécriture de l'API token (`token_get_all()`) en objets.

**Suppressions**
- L'extension `xmlrpc` est sortie du cœur, déplacée vers PECL.

---

### PHP 8.1 — 25 novembre 2021

Considérée comme la version « OOP enfin complète ».

**Système de types et OOP**
- **Enums** natifs (énumérations « pures » et « backed » avec `string` ou `int`), avec méthodes, constantes, interfaces.
- **Readonly properties** (propriétés en lecture seule, initialisables une seule fois).
- **Intersection types** (purs) : `A&B` pour exiger plusieurs interfaces simultanément.
- Nouveau type de retour **`never`** (la fonction ne retourne jamais : `exit`, `throw`, boucle infinie).
- **`new` dans les initializers** : objets autorisés comme valeur par défaut de paramètres, propriétés statiques, constantes globales et arguments d'attributes (donc nested attributes possibles).
- **Modificateur `final` sur les constantes de classe** ; les constantes d'interface deviennent par défaut surchargeables.

**Concurrence**
- **Fibers** : primitive bas niveau pour la concurrence coopérative (vert threads), permettant à des frameworks comme AmPHP, ReactPHP ou Revolt de fournir des API non bloquantes uniformes.

**Syntaxe**
- **First-class callable syntax** : `myFunc(...)` (équivalent moderne de `Closure::fromCallable`).
- **Array unpacking avec clés string** (`[...$a, ...$b]` accepte désormais les clés associatives).
- Notation octale explicite préfixée `0o` (ex. `0o16`).
- `array_is_list()`.

**Performance**
- **Inheritance cache** dans OPcache : gain rapporté de 5 à 8 %.
- Backend **JIT pour ARM64**.
- Améliorations sur la résolution des noms de classes et certaines fonctions standard.

**Migrations vers les objets de ressources**
- Bascule progressive : `finfo`, `IMAP\Connection`, `FTP\Connection`, `GdFont` deviennent des classes plutôt que des resources.

**Déprécations**
- Passage de `null` à un paramètre interne non-nullable est désormais déprécié (préparation à PHP 9).
- Plusieurs aliases hérités.

---

### PHP 8.2 — 8 décembre 2022

**Système de types**
- **Readonly classes** : déclarer une classe entière `readonly` rend automatiquement toutes ses propriétés readonly et empêche les propriétés dynamiques.
- **Types DNF (Disjunctive Normal Form)** : combinaison d'unions et d'intersections (`(A&B)|null`), grâce à un parenthésage strict.
- **`null`, `false` et `true` comme types autonomes** (plus uniquement membres d'une union).

**Sécurité et qualité**
- Nouvel **attribut `#[\SensitiveParameter]`** : redacte automatiquement la valeur d'un paramètre dans les stack traces.
- **Nouvelle extension `random`** : API objet pour la génération aléatoire (`Random\Engine`, `Random\Randomizer`), avec moteurs interchangeables (Mt19937, Xoshiro256**, Secure, etc.). Les fonctions `rand`/`mt_rand`/`random_*` historiques restent compatibles.

**Traits**
- **Constantes dans les traits** (enfin autorisées).

**Déprécations majeures (préparation de PHP 9)**
- **Création de propriétés dynamiques dépréciée** (sauf `stdClass`, classes implémentant `__get`/`__set`, ou marquées par le nouvel attribut `#[\AllowDynamicProperties]`). Suppression prévue en PHP 9.0.
- **Callables partiellement supportés** dépréciés (`"self::method"`, `["parent", "method"]`, etc.).
- **`utf8_encode()` / `utf8_decode()`** dépréciés (noms trompeurs : ils ne convertissent qu'entre ISO-8859-1 et UTF-8).
- Interpolation de chaînes `${var}` dépréciée (forme `{$var}` conservée).
- Compilation de mysqli avec libmysql interdite (mysqlnd uniquement).

**Divers**
- `mysqli_execute_query()`, méthode `mysqli::execute_query()` pour des requêtes paramétrées en une ligne.
- Modificateur `/n` (no capture) pour les fonctions `preg_*`.
- Nouvelles fonctions : `memory_reset_peak_usage()`, `ini_parse_quantity()`, `curl_upkeep()`.

---

### PHP 8.3 — 23 novembre 2023

**Système de types et OOP**
- **Constantes de classe typées** (classes, interfaces, enums, traits). Comble la dernière incohérence du système de types : `const string VERSION = "...";`.
- **Amendements à readonly** : possibilité de réinitialiser une propriété readonly une fois dans la méthode magique `__clone` (deep cloning natif de structures immuables).
- **Classes anonymes readonly** (`new readonly class { ... }`).
- **Attribut `#[\Override]`** : déclare explicitement qu'une méthode est censée surcharger une méthode parente ; erreur de compilation si ce n'est pas le cas.
- **Fetch dynamique des constantes de classe** : `Foo::{$name}` (équivalent de `constant()` mais en syntaxe directe).

**Fonctions et qualité**
- **`json_validate()`** : validation d'une chaîne JSON sans construire la structure en mémoire (économie significative pour les gros payloads).
- Nouveautés sur la classe `Random\Randomizer` (8.2) : `getBytesFromString()`, `getFloat()`, `nextFloat()`.
- Détection du **stack overflow** dans le moteur.
- Exceptions plus précises pour `DateTime`/`DateTimeImmutable` (`DateMalformedStringException`, etc.).
- Nouvelle commande `php --ini` étendue, linter CLI acceptant des entrées variadiques.

**Performance**
- Améliorations de la résolution des constantes de classe et performance des Fibers.

**Déprécations**
- `get_class()` / `get_parent_class()` sans argument.
- `MT_RAND_PHP` (variante cassée historique de Mt19937).
- Plusieurs INI directives `assert.*`.
- `ldap_connect()` à 2 paramètres.

---

### PHP 8.4 — 21 novembre 2024

Première version sous le nouveau cycle de support communautaire (2 ans actif + 2 ans sécurité, EOL au 31 décembre).

**OOP — révolution attendue depuis 15 ans**
- **Property hooks** (RFC d'Ilija Tovilo et Larry Garfield) : définition directe sur la propriété de la logique `get` et `set`, propriétés virtuelles, propriétés déclarables sur les interfaces. Supprime l'essentiel du boilerplate getter/setter.
- **Asymmetric visibility** : visibilité différente en lecture et en écriture (par ex. `public private(set) string $name;`). Combinable avec `readonly` et avec la promotion constructeur.
- **`new` sans parenthèses** pour le chaînage de méthodes / propriétés / constantes après instanciation : `new Foo()->bar()` au lieu de `(new Foo())->bar()`.

**Performance**
- **Nouvelle implémentation du JIT basée sur le framework IR** (Intermediate Representation) : génère ~5–10 % de code plus rapide et plus compact, simplifie le support multi-architectures, et consomme moins de mémoire.
- Le pilotage du JIT change : `opcache.jit_buffer_size=0` ne suffit plus à le désactiver, il faut explicitement `opcache.jit=disable`.
- **Lazy objects** natifs (ghost objects et proxies via la Reflection) : feature longtemps réservée aux frameworks (Symfony VarExporter, Doctrine), désormais dans le cœur, pour les conteneurs DI et l'hydratation ORM.

**Tableaux et chaînes**
- **Nouvelles fonctions de recherche dans les tableaux** : `array_find()`, `array_find_key()`, `array_any()`, `array_all()`.
- `mb_trim()`, `mb_ltrim()`, `mb_rtrim()`, `mb_ucfirst()`, `mb_lcfirst()`.

**HTML / XML**
- **Parser HTML5 natif** : nouvelle classe `\Dom\HTMLDocument` (créée via `createFromString()` / `createFromFile()`) compatible avec la spec HTML5/WHATWG. `\DOMDocument` reste disponible pour la rétrocompatibilité.

**Attributs et qualité**
- Attribut natif **`#[\Deprecated]`** (avec messages, version, etc.) : remplace les conventions docblock `@deprecated`.
- `#[\Override]` extensible.
- Fonction `request_parse_body()` pour parser les requêtes multipart en dehors de POST.

**BCMath / DateTime / Round**
- BCMath : `bcceil()`, `bcfloor()`, `bcround()`, `bcdivmod()`, support objet.
- DateTime : `createFromTimestamp()`, accesseurs microseconde.
- Enum **`RoundingMode`** avec 4 nouveaux modes (`TowardsZero`, `AwayFromZero`, `NegativeInfinity`, `PositiveInfinity`).

**PDO**
- Sous-classes spécifiques par driver : `Pdo\Mysql`, `Pdo\Sqlite`, `Pdo\Pgsql`, etc.

**Déprécations**
- **Paramètres implicitement nullable** dépréciés (`function f(int $x = null)` doit devenir `function f(?int $x = null)`).
- Sessions par GET/POST (cookies obligatoires en pratique).
- `session.sid_length` et `session.sid_bits_per_character` dépréciés.
- `GMP` devient `final`.

---

### PHP 8.5 — 20 novembre 2025

Sortie le 20 novembre 2025 (RC4 le 6 novembre, GA le 20). Support actif jusqu'au 31 décembre 2027, support sécurité jusqu'au 31 décembre 2029.

**Syntaxe**
- **Pipe operator `|>`** : chaînage de callables de gauche à droite. Le résultat de la callable de gauche est passé en argument à celle de droite. Implémenté au niveau du compilateur (transformation à la compilation, pas de coût runtime).
- **Clone with** : `clone($object, ['propriete' => $valeur])` permet de modifier des propriétés (y compris readonly) lors du clonage. Simplifie radicalement le pattern « with-er » sur les classes immuables.
- **Closures et first-class callables dans des expressions constantes** : possibilité d'utiliser `static fn(...)` comme valeur d'attribut, de constante de classe ou de paramètre par défaut. Permet enfin de définir des closures à l'intérieur d'attributes.

**Réseau / Web**
- **Nouvelle extension URI** intégrée au cœur (basée sur uriparser et Lexbor) avec deux API conformes : `Uri\Rfc3986\Uri` (RFC 3986) et `Uri\WhatWg\Url` (WHATWG URL Standard). Remplace `parse_url()` pour les usages sérieux : standards-compliant, sans ambiguïtés, immutable. `parse_url()` reste disponible mais marqué comme non recommandé pour des entrées non fiables.
- `curl_multi_get_handles()` pour récupérer toutes les handles d'un multi-handle cURL.

**OOP et types**
- **Visibilité asymétrique étendue aux propriétés statiques**.
- **Propriétés `final` via la promotion constructeur**.
- **Attributs autorisés sur les constantes** (de classe, mais aussi globales).
- **Attribut `#[\NoDiscard]`** : émet un avertissement si le retour d'une fonction/méthode est ignoré ; cast `(void)` pour marquer un rejet intentionnel.
- `#[\Override]` désormais applicable aux propriétés (cohérence avec les hooks).
- `#[\Deprecated]` applicable aux traits.

**Diagnostics et runtime**
- **Backtraces dans les erreurs fatales** (timeouts, mémoire, stack overflow, etc.) : fin d'une frustration historique du débogage PHP.
- Nouvelle constante `PHP_BUILD_DATE` (date de compilation du binaire en cours).
- Option CLI `php --ini=diff` pour n'afficher que les directives INI différentes des valeurs par défaut.
- `get_error_handler()`, `get_exception_handler()` (récupération des gestionnaires actifs).

**Internationalisation et DOM**
- `Locale::isRightToLeft()` / `locale_is_right_to_left()` pour détecter les locales RTL.
- Classe `IntlListFormatter` (formatage de listes selon les règles grammaticales locales : « A, B and C »).
- Méthodes DOM additionnelles : `getElementsByClassName()`, `insertAdjacentHTML()`.
- Fonction `grapheme_levenshtein()`.

**Tableaux**
- `array_first()`, `array_last()` (complètent `array_key_first` / `array_key_last` introduits en 7.3).

**Performance et build**
- **OPcache n'est plus optionnel** : il est désormais toujours compilé statiquement dans PHP (comme `ext/date`, `ext/standard`, etc.). Son activation reste pilotée par les directives INI.

**Déprécations préparant PHP 9**
- **Opérateur backtick `` ` ` ``** comme alias de `shell_exec()`.
- **Noms de cast non canoniques** : `(boolean)`, `(integer)`, `(double)`, `(binary)` au profit de `(bool)`, `(int)`, `(float)`, `(string)`.
- Terminaison des `case` de `switch` par un point-virgule au lieu des deux-points.
- Utilisation de `null` comme offset de tableau ou avec `array_key_exists()`.
- Suppression de la directive INI `disable_classes` (cassait des hypothèses du moteur).
- Interdiction de `array` et `callable` comme noms d'alias pour `class_alias()`.
- Conversion implicite float → int avec perte signalée par avertissement.
- `__sleep()` / `__wakeup()` soft-deprecated au profit de `__serialize()` / `__unserialize()` (introduits en 7.4).
- Constantes `MHASH_*` (transition vers l'extension Hash).

## Caveats

- Les **dates de fin de support (EOL)** ont changé de modèle à partir de PHP 8.4 : EOL fixé au 31 décembre, deux ans de support actif puis deux ans de support sécurité (au lieu de 2+1). Pour les versions antérieures, l'EOL réelle est calée sur la date anniversaire de sortie.
- Concernant les performances annoncées (×2 pour PHP 7.0, ×3 pour le JIT en synthétique, etc.), il s'agit de chiffres communiqués par l'équipe PHP / Zend / Phoronix sur des benchmarks ciblés (WordPress, Drupal, Magento, Mandelbrot). Les gains sur des applications IO-bound réelles sont presque toujours inférieurs (en pratique, le JIT n'apporte qu'un gain modeste sur du code web typique ; il devient déterminant pour le calcul, le traitement d'image, l'analyse numérique, etc.).
- Quelques fonctionnalités sont parfois attribuées à la mauvaise version dans la littérature secondaire : `array_key_first/last` est de **PHP 7.3** (et non 8.x) ; `str_contains` est de **8.0** ; `enum`, `readonly`, `never` et `fibers` sont tous de **8.1** ; les classes readonly sont de **8.2** ; les constantes de classe typées de **8.3** ; les hooks de propriétés et la visibilité asymétrique de **8.4**.
- Le projet PHP a connu une **inflexion organisationnelle** entre 8.1 et 8.4 avec la création et la montée en puissance de la **PHP Foundation** (fin 2021), qui a financé une part importante du travail sur Fibers, property hooks, asymmetric visibility, l'extension URI, et le nouveau JIT IR. Cela explique en partie l'accélération du rythme de modernisation du langage.
- L'objectif déclaré pour PHP 9.0 (date non encore officielle au moment où ce document est rédigé) est de transformer en erreurs fatales un grand nombre des déprécations introduites entre 8.1 et 8.5 (propriétés dynamiques, paramètres implicitement nullable, callables partiellement supportés, casts non canoniques, etc.).