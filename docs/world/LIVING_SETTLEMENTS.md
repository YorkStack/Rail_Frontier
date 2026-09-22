# Lebendige Orte, Bahnhofszugänge und Epochen

Stand: 22. September 2026. Produktentscheidung und umsetzbare Arbeitspakete aus dem Nutzerwunsch. Die Ausrichtungshilfe, dauerhafte Zeitanzeige und LIV-01a (zusammenhängende dargestellte Wege) sind umgesetzt. Anschlussvorschau vor dem Kauf und ein gestützter gepflasterter Vorplatz sind als LIV-01b umgesetzt; LIV-01c ergänzt nun navigierbare Einmündungen und Eingänge mit geprüftem Weg zum Ortsknoten. Bewohner, Tiere und ausdrücklich gebaute Bahnübergänge bleiben offen. Siehe [Navigationsstand](SETTLEMENT_NAVIGATION_CHECKPOINT.md). Details und Grenzen: [SETTLEMENT_PATHS_CHECKPOINT.md](SETTLEMENT_PATHS_CHECKPOINT.md).

## Was das Spiel heute tatsächlich kann

- Bahnhöfe sind vor dem Bau in 5°-Schritten drehbar. Die Ausgangsrichtung ist 0°, nicht das Ergebnis einer Optimierung. Neue Links-/Rechtsknöpfe drehen um 15°; eine Ortsauswahl kann die Vorschau auf die direkte Richtung zum Ziel drehen. Das ist eine Orientierungshilfe, kein Nachweis für die günstigste oder baubare Strecke. Geländeprüfung und Baupreis bleiben verbindlich. Bestehende Bahnhöfe lassen sich nicht nachträglich mitsamt angeschlossenen Gleisen drehen.
- Die bisherigen Ortsstraßen sind Geländeoberflächen mit prozeduralen Erd-, Pflaster- und Asphalttexturen. Sie orientieren sich an Häuserreihen und Hofgruppen. LIV-01a verbindet vorhandene Haustüren über ein geprüftes lokales Wegenetz und umgeht Gebäude, Wasser und Gleise. Nicht gefundene Bahnhofszugänge werden angezeigt; durch Bahnen getrennte Ortsteile bekommen keinen erfundenen Übergang. Die Anschlussvorschau zeigt den Weg bereits vor dem Kauf. Ein geprüfter gepflasterter Vorplatz überbrückt kleine Höhenunterschiede mit einer kurzen Rampe und Fundamentseiten. Navigierbare Einmündungen und Eingänge sind als abgeleitetes Wegenetz vorhanden. Aufwendigere Geländestufen, ausgewiesene Bahnübergänge und Personenverkehr fehlen noch.
- Bahnhofsnutzung wird derzeit über Einzugsradius und Zugverbindung bestimmt, nicht über eine Straßenverbindung. Ein Bahnhof erhält einen sichtbaren Weg, wenn die lokale Anschlussprüfung gelingt; seine Nutzung hängt noch nicht von diesem Weg ab.
- Der gespeicherte Kalender startet regulär 1900: 1.200 Simulationstakte = ein Wirtschaftstag, 360 Tage = ein Spieljahr. Ein Jahr dauert bei 1× sechs Stunden, bei 8× theoretisch 45 Minuten ohne Pausen/Leistungslimit. Ein Jahrhundert würde bei 8× etwa 75 Stunden benötigen. Die Zeit kann technisch weiterlaufen, aber Inhalt und Balance über mehrere Jahrhunderte sind nicht fertig.
- Fahrzeuge werden jahresabhängig freigeschaltet; der aktuelle Katalog reicht bis zur El-18-Epoche ab 1996. Ortsstraßen verwenden seit dem Grafik-Update regionale Beläge, mit Asphalt ab 1960; Feld- und Hauswege bleiben unbefestigt. Bahnhöfe besitzen drei Bauzeit-Familien (<1920, 1920–1959, ab 1960), erhalten aber ihre ursprüngliche Architektur. Das sind Gestaltungsvorgaben, keine historisch exakte Modernisierungssimulation. Siehe [Material- und Architekturstand](REGIONAL_STATION_ART.md).
- Bevölkerung, wartende Fahrgäste, Post, Holz, Bretter und Industrieproduktion existieren als aggregierte Simulation. Es gibt noch keine dargestellten Bewohner, Karren, Straßenfahrzeuge oder Nutztiere.

## Zielbild

Ein Ort wirkt als zusammenhängende Siedlung: Türen führen auf kurze Hauswege, diese auf Gassen oder eine Hauptstraße und weiter zum Bahnhofsvorplatz, Laden, Hafen oder Arbeitsplatz. Straßen nicht wahllos zwischen jedem Häuserpaar ziehen. Vorgärten, Höfe, Zäune, Stapelplätze und Weiden unterbrechen den Rasen. Der Spieler sieht beim Heranzoomen kleine, nachvollziehbare Alltagsabläufe. Die regionale Ansicht bleibt übersichtlich.

Bahnhöfe erhalten eine erkennbare öffentliche Zugangsseite und eine Gleisseite. Ein späterer Knopf „Zugang wechseln“ kann das Gebäude auf die andere Gleisseite setzen, ohne beide Dinge mit der Gleisrichtung zu verwechseln. Ein gebauter Bahnhof darf nicht stillschweigend drehen; ein späterer Umbau benötigt Vorschau, Kosten und Prüfung aller Gleisverbindungen.

## LIV-01: Zusammenhängende Ortswege und echte Zugänge

**LIV-01a, Anschlussvorschau/gestützter Vorplatz (LIV-01b) und das initiale Wegenetz mit Einmündungen/Eingängen (LIV-01c) sind umgesetzt.** Ausgewiesene Bahnübergänge/Unterführungen und eine wegeabhängige Nachfrage bleiben spätere Schritte. Der folgende vollständige Vertrag ist noch nicht insgesamt erfüllt. Siehe [aktuellen Teilstand](SETTLEMENT_PATHS_CHECKPOINT.md).

1. Gebäudemanifest/Blender-Objekte um tatsächliche Eingangspunkte, Hofflächen und optionale Ladepunkte ergänzen. Keine Verbindung zum geometrischen Hausmittelpunkt. Bestehende Hausausrichtung berücksichtigen.
2. Ein deterministisches lokales Wegenetz erzeugen: Hauptgasse → Nebengassen → kurze Hauszugänge. Hafenreihen, Bergterrassen und Bauernhöfe behalten verschiedene Grundrisse. Jede bewohnte Parzelle besitzt einen prüfbaren Weg bis zu einem Ortsknoten.
3. Kurven, Kreuzungen und Einmündungen als durchgehende Flächen mit korrekten Rändern erzeugen. Matsch-/Kiesflächen, Pflasterfugen, Bordkanten und kleine Vorplätze nach Ortstyp; keine sichtbaren Lücken als Ersatz für Hindernisbehandlung.
4. Stationseingang und Vorplatz an den nächsten **erreichbaren** Ortsweg anschließen. Terrain, Gebäude, Wasser und Gleise mitprüfen; nicht einfach die nächste Gerade zeichnen. Fällt der Anschluss aus, im Baupanel „Kein Weg zum Ort“ und einen korrigierbaren Grund zeigen. Ein ländlicher Betriebsbahnhof ohne Siedlungszugang bleibt möglich.
5. Keine begehbaren Wege durch Gleise ohne ausgewiesenen Übergang. Zunächst Weg auf derselben Gleisseite oder klare fehlende Verbindung; danach beschrankte Querung/Unterführung als eigenes geprüftes Bauteil. Eine dekorative Linie darf keine sichere Querung suggerieren.
6. Bisherige Einzugsradius-Regel erst dann durch Wegerreichbarkeit ergänzen, wenn Anschlussplanung, Kosten, Neubau und Wiederherstellung alter Spielstände vollständig getestet sind. Bis dahin den Zustand ehrlich als Darstellung behandeln.

Dateien: bestehende `src/rendering/settlement-roads.ts`, `settlement-placement.ts`, `arizona-settlement-placement.ts`; neues unabhängiges Ortswege-Modul unter `src/world/`; Eingangssockets in `tools/`-Blendergeneratoren und Assetmanifest; Stationseingang in `station-layout.ts`/Renderlayout. Keine zweite konkurrierende Straßengenerierung daneben behalten.

Abnahme: jedes Haus hat einen erreichbaren Zugang; Wege umgehen Hausgrundrisse und Wasser; ein neu gedrehter Bahnhof verbindet die richtige Gebäudeseite; entfernte/ungeeignete Standorte melden fehlenden Anschluss; Geländeänderung/Bahnbau invalidieren betroffene Wege; gespeicherte Unternehmen erzeugen dieselbe Ortsgeometrie. Feste Nahaufnahmen von Sundvik, Granli, Fjellhavn und Arizona mit Texturen und vollständigen Übergängen.

## LIV-02: Bahnhofsvorplatz und erste Bewohner

Erster spielbarer Ausbau: Sundvik/Granli, Startjahr 1900, Fußwege zum Bahnhof, wartende Personen, Aussteigen und Fortgehen. Noch keine ganze Bevölkerung einzeln simulieren.

- Repräsentative sichtbare Personen aus der vorhandenen Ortsnachfrage und Zughalte-/Ladungszuständen ableiten. Sie erzeugen niemals zusätzliche Fahrgäste, Einnahmen oder Waren. Bei tatsächlicher Nachfrage entstehen kleine Gruppen; unbediente Bahnhöfe zeigen keinen erfundenen Pendlerandrang.
- Wegeziele: Haustür, Bahnsteigzugang, Wartepunkt, Laden-/Markteingang, Sägewerkstor, Lagerplatz. Fehlende Zieltypen zunächst nicht vorspiegeln: Laden-/Fabrik-Assets und Rollen müssen vorher vorhanden sein.
- Zustände: gehen, kurz warten, am Bahnhof warten, ein-/aussteigen. Sägewerksarbeiter wechseln zwischen Wohnort und zugänglichem Werkstor; das ist zunächst eine Darstellung von Ortsaktivität, keine neue unsichtbare Arbeitskräftewirtschaft.
- Menschen bleiben auf Gehwegen, Vorplätzen und Höfen. Kein Durchlaufen von Hauswänden, Gleisen, Felsen oder Wasser. Einstieg nur an erreichbaren Plattformen bei haltendem Zug.
- Eigene Blender-Figuren mit gemeinsamen Materialien, Varianten für Kleidung und einfache gebackene Geh-/Warteanimationen; keine Strichmännchen als fertiger Grafikstand deklarieren. Größenvergleich gegen Tür, Reisewagen und Plattform.

Abnahme: Nachfrage null/hoch, kein Zug/haltender Zug, voller Zug, blockierter Zugang, Pause/8×, Laden, Sprachwechsel und Zoom testen. Mit ausgeschalteter Belebung müssen Firmenkontostand, Passagier- und Warenmengen exakt identisch bleiben.

## LIV-03: Epochenpassender Straßenverkehr und Warenbilder

- Zunächst Handkarren und einzelne Pferdefuhrwerke zu Warenhof und Bahnhof; später gemischte frühe Automobile/Lieferwagen und schließlich modernere Lastwagen, Busse und Pkw.
- Übergänge schrittweise nach Epoche und Ortsrolle: asphaltierte Hauptstraße darf neben unbefestigtem Hofweg bestehen. Kein weltweiter Austausch sämtlicher Pferde, Häuser und Straßen in einem einzigen Jahr.
- Warenzustellung/Abholung am Ladepunkt aus Lagerfüllung und tatsächlichem Umschlag ableiten. Repräsentative Lieferfahrt verändert nicht heimlich denselben Warenbestand ein zweites Mal.
- Höfe und Lieferbuchten erhalten Wendeflächen. Überholmanöver und vollständige Verkehrs-Mikrosimulation sind dafür nicht erforderlich; Kollisionen und unzulässige Gleisquerungen bleiben ausgeschlossen.
- Bestehende Gebäude altern/modernisieren sich über spätere explizite Ausbauphasen. Ein Jahrhundertwechsel darf nicht alle ursprünglichen Holzhäuser verschwinden lassen.

Abnahme: feste Vergleichsszenen 1900, 1930, 1960, 2000; Fahrzeuge/Kleidung/Materialien aus deklarierter Epochenliste; Lieferziel erreichbar; keine Warenverdopplung; Belebung beeinflusst Zugreservierungen nicht.

## LIV-04: Tiere mit räumlichem und zahlenmäßigem Zusammenhang

Die folgenden Zahlen sind anfängliche **Gestaltungsbudgets**, keine historischen Bestandszahlen:

| Umfeld | Ziel für die erste Nahszene |
| --- | --- |
| Ortskern mit etwa 15 sichtbaren Wohn-/Geschäftsbauten | etwa 12–30 sichtbare Menschen, je nach Nachfrage; 0–2 Hunde, 0–2 Katzen; keine zufälligen Kuhherden |
| Kleiner Hof mit Stall und nutzbarer Weide | 2–6 Kühe **oder** 4–10 Schafe; nicht jede Tierart auf jeden Hof setzen |
| Geeigneter Bergbauernhof | alternativ 3–8 Ziegen auf ausgewiesener sicherer Fläche |
| Bahnhof/Warenhof um 1900 | 0–2 Fuhrwerke je aktiver Nahszene; Zugpferde gehören zum Fuhrwerk, nicht zusätzlich als freilaufende Herde zählen |

Tiere erhalten einfache Zustände wie stehen, grasen, einige Meter gehen; Katzen am Hof/Gebäude, Hunde bei Personen oder Höfen. Einfriedungen und Tore strukturieren Tierbereiche. Tiere queren keine aktiven Gleise und spawnen nicht auf steilen Felswänden. Mehr Wohnhäuser allein vervielfachen nicht automatisch die Nutztierzahl: Hof-/Weidekapazität ist entscheidend.

Abnahme: artspezifische Gebietsmasken und Obergrenzen, kein Spawn ohne geeignetes Habitat, keine Häufung an Zoomgrenzen, Erhalt stabiler Varianten beim Laden, maßstäbliche Blender-Silhouetten und Bewegungen.

## LIV-05: Epochenverlauf als spielbare Progression

Zunächst das **20. Jahrhundert** mit vorhandenen Bahn-Epochen gut spielbar machen; ein Start im 19. Jahrhundert und weitere Zukunftstechnik brauchen jeweils passende Fahrzeuge, Bauten und Balance. Noch keine fertige Mehrjahrhundert-Kampagne behaupten.

Spielkalender und sichtbare Bewegung nicht blind gemeinsam beschleunigen: schnellerer Epochenfortschritt darf nicht sämtliche Unterhaltskosten, Nachfrage und Fahrten unerwartet vervielfachen. Vor Änderung an 1.200 Takten/Tag Wirtschaft, Instandhaltung, Jahresfreigaben und Speicherstände zusammen bewerten. Eine spätere konfigurierbare Epochenlänge benötigt einen versionierten gespeicherten Kalender; Bestandsspiele müssen ihre vereinbarte Zeitbasis behalten oder explizit migriert werden.

Aktuell bleibt „Tag N · Jahr“ ehrlich, weil 360 Wirtschaftstage keinen echten gregorianischen Kalender darstellen. Erst mit geklärtem Kalender echte Monatsnamen/Datum einsetzen. Keine Uhrzeit anzeigen, solange das Spiel keine Tageszeit-, Fahrplan- oder Schichtmechanik hat. Neu heute: Tag/Jahr stehen dauerhaft bei Pause/Tempo, auch während des Baus.

Abnahme: Jahrhundertwechsel und Jahresfreigaben, Save/Load an Tages-/Jahresgrenzen, Einnahmen/Unterhalt pro vereinbartem Zeitraum, Pause/1×/8×, verständliche bevorstehende Fahrzeugfreigabe. Aussehen und Bewegung der Bevölkerung wechseln nicht zufällig beim Zoomen.

## Leistung und Darstellung

- Zuerst nur die nahe betrachtete Siedlung detailliert beleben. Nach projizierter Größe und Sichtbarkeit abgestufte Detailstufen, Übergänge mit Hysterese; außerhalb des Bildes keine teuren Animationsaktualisierungen.
- Vorläufiges Höchstbudget: 96 Personen, 12 Straßenfahrzeuge/Fuhrwerke und 32 Tiere gleichzeitig in der nahen Szene. Ein globaler Pool verhindert Multiplikation bei zwei sichtbaren Orten. Das ist eine Obergrenze, keine Pflichtdichte.
- Gemeinsame Materialien, instanzierbare/gebackene Animationen, keine einzelnen Schattenlichter oder umfassende Kollisionstests pro Person und Frame.
- Sichtbare Bewegung folgt Pause und respektiert reduzierte Bewegung. Bei 8× dürfen repräsentative Figuren nicht mit achtfacher Gehgeschwindigkeit durch die Stadt schießen; ihre Darstellungszeit darf begrenzt sein, während echte Transportzahlen allein aus der Simulation stammen.
- Option „Stadtleben: Aus / Sparsam / Normal“. Aus verändert keinerlei Spielregeln. Schon vorhandene Speicherstände bleiben ohne Belebung lauffähig.
- Vor Freigabe einen 60-Sekunden-Nah-/Fern-Kameraschwenk mit und ohne Belebung messen: zusätzliche CPU-/GPU-Kosten, Framezeiten, Draw Calls, Instanzen und Speicher. Bestehende Szenenbudgets weiter einhalten; Zahlen erst nach echter Messung als erreicht ausweisen.

## Quellen und Bildrecherche

Originalmodelle in der lokalen Blender-Pipeline entwickeln; Archivbilder dienen als Form-, Material- und Alltagsreferenz, nicht ungeprüft als Spieltexturen.

- [Norsk Folkemuseum: Norwegian culture/open-air museum](https://norskfolkemuseum.no/en/explore-norwegian-culture-at-norsk-folkemuseum): gepflasterte Stadtgassen, regional zusammengestellte Höfe mit Feldern/Weiden. Hilft bei der Trennung von Stadtblock und Bauernhof.
- [Norsk Folkemuseum: About](https://norskfolkemuseum.no/en/about): städtische Häuser in Blockstraßen, ländliche Gebäude in Hofgruppen; Referenz für den Ortsgrundriss.
- [Bergen byarkiv: Hest i sentrum](https://www.bergen.kommune.no/hvaskjer/tema/bergen-byarkiv-forteller/byhistorie/fortellinger-fra-arkivet/hest-i-sentrum): Quellenbilder und Dokumente zu Pferdetransport von Waren und Menschen, Hofställen und schrittweisem Ersatz durch Motorfahrzeuge. Unterstützt ausdrücklich gemischte Übergangsepochen; keine pauschale landesweite Jahresgrenze daraus ableiten.

Die Referenzen betreffen Norwegen. Arizona braucht vor LIV-02/03 eigene Orts-/Epochenreferenzen und bleibt bis zur separaten Spielkampagne eine Landschaftsstudie. Infrastrukturmodule sollen wiederverwendbar sein, die regionale Gestaltung nicht blind kopiert werden.
