# Bahnhöfe ausbauen: Bahnsteige, Güteranlagen und Rangieren

Stand: 22. September 2026. Geplante Erweiterung, noch kein vorhandenes Mehrgleis- oder Rangiersystem. Auftrag: größere Bahnhöfe benötigen zusätzliche Bahnsteige, Weichen und Abstellgleise; Güteranlagen sollen Personenbahnhöfe ergänzen können. Diese Planung ersetzt keine Sicherheits- oder Geometrieprüfung.

## Ausgangslage und sofortige Korrekturgrenze

Ein neuer Bahnhof besitzt heute genau einen Haltepunkt, zwei interne Gleisabschnitte und zwei äußere Anschlüsse. Die sechs Klassen erhöhen Katalogwerte; mehrere Bahnsteige oder ein echter Rangierbahnhof entstehen dadurch nicht. `vehicleIds` bezeichnet Fahrzeugtypen im Zug, keinen Bestand einzeln abgestellter Wagen. Der Dispatcher reserviert einen ganzen Abschnitt bis zum nächsten Halt. Ein gemeinsamer Knoten allein ist keine vollständige Weiche mit Verschluss und Freimeldung.

Eine bekannte Prüfaufgabe dieser Runde: Eine Klassenaufwertung darf keine längeren Züge zulassen, als auf das tatsächlich gebaute Gleis passen. Bis physischer Umbau verfügbar ist, bleiben nutzbare Längen durch das gespeicherte Bauwerk begrenzt. Fehlende Mehrgleisigkeit darf nicht durch zusätzliche dekorative Schienen oder unbelegte Kapazitätszahlen vorgetäuscht werden.

## Spielerablauf und schrittweise Freigabe

1. **Erste Bahn:** ein Bahnhofsgleis, ein Bahnsteig, zwei Anschlüsse. Die Einführung bleibt einfach.
2. **Mehr Verkehr:** nach dem ersten laufenden Verkehr erscheint optional „Bahnhof ausbauen“. Vorlagen „Zweites Bahnsteiggleis“, „Ausweichgleis“ und „Abstellgleis“ zeigen Nutzen, Flächenbedarf, Kosten und anschließbare Weichen. Fortgeschrittene können diese Werkzeuge ohne erzwungenen Tutorialabschluss öffnen.
3. **Waren bedienen:** „Güterbereich ergänzen“ fügt Ladegleis, Güterschuppen/Rampe, Lagerfläche und Straßenzugang hinzu. Ein Güterbahnhof kann eigenständig oder als Teil desselben Bahnhofsareals betrieben werden.
4. **Züge abstellen und ändern:** einen betrieblich freien Zug ins Abstell-/Werkstattgleis schicken, Wagen hinzufügen/entfernen, Vorschau prüfen, Umbau beauftragen. Vorgänge kosten Zeit und gegebenenfalls Geld. Die einfache Verwaltung funktioniert vor einer optionalen detaillierten Rangierdarstellung.
5. **Großer Knoten:** mehr Bahnsteige, getrennte Ein-/Ausfahrgruppen und Ladegleise, automatische Gleiswahl mit verständlicher Begründung; manuelle Zuweisung als erweiterte Option.

Keine Pflicht, für den ersten Personenzug Signale, Fahrstraßen und Kupplungsdetails zu verstehen. Die zusätzliche Komplexität folgt einem sichtbaren Bedarf: wartende Züge, überfüllte Bahnsteige, neue Industrieaufträge oder ein zu langer Zug.

## STX-01: Physischer Ausbaubereich und Vorschau

Der Bahnhof wird ein persistierter **Standort** mit stabiler Stations-ID und einzeln identifizierten Gleisen/Bahnsteigen. Pro Gleis: echte Graphkanten, Endanschlüsse, nutzbare Länge, zulässige Nutzung, Spurweite, Elektrifizierung und Halteposition. Bahnsteige sind eigene Flächen mit zugeordneten Gleiskanten; Inselbahnsteige können zwei Seiten haben. Güterflächen und Besucherzugänge sind getrennte Module desselben Standorts.

Der Standort behält seine Identität in Linien, Frachtzielen und Spielständen. Ein Ausbauplan enthält neue/ersetzte Geometrie, geänderte Erdarbeiten, Zugänge und Kosten. Unveränderte Anschlüsse bleiben stabil. Belegte oder reservierte Abschnitte können nicht im Hintergrund verschoben werden. Falls eine Sperrpause erforderlich ist, erklärt die Vorschau welche Züge betroffen sind und wartet auf einen sicheren Zustand.

Abnahme: Gelände-/Haus-/Wasserprüfung; keine Änderung vor Bestätigung; atomarer Kauf oder vollständige Ablehnung; keine doppelten Kosten bei erneutem Klick; abgebrochener Ausbau lässt vorhandene Bahn vollständig benutzbar; Speichern vor/während/nach Umbau ist definiert.

## STX-02: Weichen, Bahnhofsköpfe und sichere Gleisbelegung

Weichen haben real befahrbare Kurven, Stamm-/Zweig-Anschlüsse, geometrische Geschwindigkeit und eindeutige Konfliktbereiche. Erst einfache Weiche und Ausweichstelle, später Gleiswechsel und komplexere Bahnhofsköpfe. Mindestbogenradius, Spurweite, Gradiente und Freiraum bleiben verbindlich. Keine Kreuzung wird ohne bewussten Anschluss zur Weiche.

Eine Fahrstraße reserviert den gesamten Konfliktbereich einschließlich Durchrutsch-/Sicherheitsabstand und **Zugende**, nicht nur den Mittelpunkt der Lok. Die Weiche ist während einer Durchfahrt verriegelt. Abgestellte und am Bahnsteig wartende Züge belegen ihre Gleise ebenfalls. Ein Bahnsteig darf erst angeboten werden, wenn ein ausreichend langes freies Gleis samt erreichbarer Einfahrt verfügbar ist. Gleichzeitige nicht kollidierende Einfahrten dürfen sich später parallel bewegen.

Der bestehende konservative Abschnittsverschluss bleibt aktiv, bis gezielte Mehrgleis- und Zuglängenprüfungen die neue Belegung absichern. Automatische Auswahl meldet „Gleis 2 belegt“, „Zug zu lang“ oder „Einfahrt wartet auf Güterzug“, statt nur „blockiert“.

Abnahme: zwei gegenüber anfahrende Züge; belegtes Abstellgleis; Zugschwanz auf der Weiche; unterschiedliche Zuglängen; Kreuzungsfahrstraßen; spätes Umstellen; Pausieren/8×/Laden während einer Durchfahrt; deterministische Priorität ohne Verhungern; Ablehnung von Abriss oder Umbau unter fahrenden Zügen.

## STX-03: Mehrere Bahnsteige und Haltegleiswahl

Linien wählen standardmäßig den Standort, der Betrieb ein kompatibles freies Haltegleis. Eine optionale Vorgabe „Gleis 1“ bleibt gespeichert, benötigt aber eine Fehlermeldung und eine ausdrücklich wählbare automatische Alternative, falls es ausfällt. Ein Inselbahnsteig teilt Fußgängerfläche, nicht Gleisbelegung. Erreichbarkeit für Fahrgäste erfolgt über LIV-01-Zugänge und definierte Querungen/Unterführungen; Menschen laufen nicht beliebig über Gleise.

Die nutzbare Länge stammt aus gebauter Geometrie, auch nach einem Klassenwechsel. Ein überlanger Zug hält nicht einfach halb außerhalb des Bahnsteigs. Später kann ein ausdrücklich gestaltetes Teilbedienungssystem hinzukommen; zunächst klare Ablehnung.

Abnahme: zwei Züge gleichzeitig an verschiedenen Bahnsteiggleisen; gleiche Linie auf wechselnden Gleisen; inkompatible Elektrifizierung; Reservierung bleibt beim Laden erhalten; Ein-/Ausstieg nur am tatsächlichen Halt und ohne doppelte Fahrgasterzeugung.

## STX-04: Güterbereich als Ergänzung oder eigener Bahnhof

Personenmodule bedienen Reisende/Post, Gütermodule passende Waren über Ladepunkte und Lager. Ein Standort darf beides enthalten, erhält aber getrennte Gleisnutzung und Kapazitätsanzeigen. Güterfahrten blockieren nicht automatisch jeden Personenbahnsteig; gemeinsame Bahnhofsköpfe können bewusst ein Engpass bleiben.

Bestehende Warenbestände, adressierte Sendungen und Industrieverträge bleiben standortgebunden. Ein Lager wird nicht pro neuem Gleis dupliziert. Be-/Entladegeschwindigkeit hängt vom realen Modul und passenden Wagen ab. Holzrampe, Schuppen und später weitere Module werden passend zu Epoche und Ware angeboten. Straßenzugang und Belieferung nutzen LIV-01; die spätere sichtbare Lieferung ist eine Darstellung derselben Menge, keine zweite Einnahmequelle.

Abnahme: Personenzug und Holzladung am selben Standort; eigenständige Güteranlage ohne Fahrgastnachfrage; volle Lager, falsche Wagenart, fehlender Zugang, leere Industrie; Einnahmen/Mengen stimmen mit dem bisherigen Wirtschaftssystem überein.

## STX-05: Abstellgleise, Wagenbestand und Zugumbildung

Abstellgleise besitzen tatsächliche freie Länge und Belegung. Fahrzeuge erhalten erst hier individuelle Bestands-IDs mit Typ, Standort/Zugehörigkeit und Zustand; vorhandene Typ-Arrays werden beim passenden Schemawechsel deterministisch migriert. Kein Wagen kann gleichzeitig im Zug und im Lager sein.

Zugumbildung startet nur bei stillstehendem Zug am geeigneten Gleis. Vorher/Nachher zeigt Lok, Reihenfolge, Wagen, Länge, Kapazität, Kosten und fehlende Kompatibilität. Belegte Wagen dürfen nicht stillschweigend gelöscht werden: zuerst abladen, zulässige Ladung übertragen oder den Auftrag ablehnen. Verkauf, Neubeschaffung und Umreihen sind getrennte Befehle. Streckenzuweisung wird nach Längen-/Strom-/Güteränderungen erneut geprüft.

Erste Fassung: verständlicher Werkstatt-/Depotauftrag mit realer Aufenthaltszeit und sicherem Abschluss. Später optional sichtbare Rangierfahrten mit Lokumlauf, Kupplung und Ziehgleis. Keine visuelle Rangierfahrt, die durch andere Fahrzeuge oder Gebäude fährt; keine Vortäuschung detaillierter Einzelwagenlogistik vor ihrer Umsetzung.

Abnahme: Wagen hinzufügen/entfernen/umreihen; volle Frachtwagen; zu kurzer Abstellplatz; doppelte Bestätigung; Unterbrechung/Speichern/Laden; Verkauf während Reservierung; keine Geld-, Wagen- oder Ladungsduplikation; alte Züge nach Migration unverändert einsetzbar.

## STX-06: Darstellung, Epochen und Bedienung

Blender liefert modulare Bahnsteigsegmente, Endrampen, Dächer, Beschilderung, Prellböcke, Güterrampen, Schuppen und Wartungsanlagen mit Anschlusspunkten und zwei LODs. Gleise, Weichenkurven und Terrain bleiben aus der geprüften Geometrie abgeleitet. Die Übersicht zeigt belegte/freie Gleise; im Nahblick passen Fahrzeuge und Bahnsteigkanten zusammen. Nummern, Status und Muster ergänzen Farben.

DE/EN-Schlüssel von Anfang an; kurze Standardtexte, technische Details aufklappbar. Tastaturbedienung, Vorschau zurücknehmen und „Zurück zum einfachen Ausbau“ gehören in jede Phase. Epochen verändern verfügbare Bauformen/Technik, ohne alte Bauwerke plötzlich auszutauschen.

## Reihenfolge, Abhängigkeiten und Tests

Zuerst aktuelle Fehler und ehrliche Kapazitätsanzeigen; danach LIV-01-Zugänge und STX-01-Daten-/Ausbauvertrag. STX-02 sichere Belegung ist Voraussetzung für STX-03/04 gleichzeitig genutzte Gleise. STX-05 Bestand/Umbildung folgt auf belegbare Abstellgleise. STX-06 wird mit jeder sichtbaren Phase umgesetzt, nicht als abschließende Dekoration.

Dateien: `domain/model.ts` und `operations.ts`; `application/stations.ts`, `trains.ts`, `routes.ts`, `ports.ts`; `simulation/occupancy.ts`, `trains.ts`, Nachfrage/Fracht; `rail/graph.ts`, Kurven/Constraints/Stationslayout; `persistence/save.ts`; `rendering/station-platform.ts`, Infrastruktur, Blendergeneratoren; `main.ts` später in getrennte Stations-/Betriebscontroller zerlegen. Kein parallel gepflegtes Alt-System.

Jede Phase benötigt Domänentests (Graph, Kosten, Belegung, Bestand), Migrationstests, reale UI-Journeys und Nah-/Fernbilder. Erst dann Performanceprüfung mit mehreren gleichzeitigen Bahnhofsvorgängen. Weiterhin keine Behauptung vollständiger Mehrgleisigkeit, nur weil ein Modell mehrere Schienen zeigt.
