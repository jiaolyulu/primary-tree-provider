import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  HeartPulse,
  Leaf,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
} from "lucide-react";
import { IntakeForm } from "@/components/IntakeForm";
import { rankProviders } from "@/lib/providers";

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string; symptom?: string; location?: string; lat?: string; lng?: string }>;
}) {
  const params = await searchParams;
  const zipcode = params.zip || "11215";
  const symptom = params.symptom || "fall risk";
  const latitude = Number(params.lat);
  const longitude = Number(params.lng);
  const hasPinnedLocation = params.location === "pin" && Number.isFinite(latitude) && Number.isFinite(longitude);
  const rankedProviders = rankProviders(
    zipcode,
    symptom,
    hasPinnedLocation ? { latitude, longitude } : undefined,
  );
  const selectedProvider = rankedProviders[0];
  const averageWait = Math.round(
    rankedProviders.reduce((total, provider) => total + provider.nextAvailableVisitDays, 0) / rankedProviders.length,
  );
  const averageAccess = Math.round(
    rankedProviders.reduce((total, provider) => total + provider.careAccessibilityScore, 0) / rankedProviders.length,
  );
  const starProviders = rankedProviders.filter((provider) => provider.starDoctor).length;
  const providerNumber = `PCT-${String(selectedProvider.providerId).slice(-4)}`;
  const matchLabel = selectedProvider.conditionMatch
    ? `location-first / ${selectedProvider.locationMatchLabel} / symptom fit`
    : `location-first / ${selectedProvider.locationMatchLabel}`;
  const topConditionTags = selectedProvider.searchableConditions.slice(0, 5);
  const selectedLatitude = selectedProvider.clinicLatitude;
  const selectedLongitude = selectedProvider.clinicLongitude;
  const originLabel = hasPinnedLocation ? "your dropped pin" : zipcode;
  const mapBBox = [
    (selectedLongitude - 0.006).toFixed(5),
    (selectedLatitude - 0.004).toFixed(5),
    (selectedLongitude + 0.006).toFixed(5),
    (selectedLatitude + 0.004).toFixed(5),
  ].join("%2C");
  const openStreetMapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapBBox}&layer=mapnik&marker=${selectedLatitude}%2C${selectedLongitude}`;
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${selectedLatitude}&mlon=${selectedLongitude}#map=18/${selectedLatitude}/${selectedLongitude}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedLatitude}%2C${selectedLongitude}`;

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link href="/" className="back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          Landing page
        </Link>
        <div className="sidebar-title">
          <Leaf aria-hidden="true" size={24} />
          <div>
            <span>PCT dashboard</span>
            <h1>Find a nearby provider tree</h1>
          </div>
        </div>
        <IntakeForm
          compact
          initialZip={zipcode}
          initialSymptom={symptom}
          initialLat={hasPinnedLocation ? latitude : undefined}
          initialLng={hasPinnedLocation ? longitude : undefined}
          initialLocationMode={hasPinnedLocation ? "pin" : "zip"}
        />

        <div className="care-summary" aria-label="Current care search">
          <span>Current intake</span>
          <dl>
            <div>
              <dt>Location</dt>
              <dd>{hasPinnedLocation ? "Map pin" : zipcode}</dd>
            </div>
            <div>
              <dt>Symptom</dt>
              <dd>{symptom}</dd>
            </div>
            <div>
              <dt>Assigned PCT</dt>
              <dd>{selectedProvider.speciesCommon}</dd>
            </div>
            <div>
              <dt>Match</dt>
              <dd>{matchLabel}</dd>
            </div>
          </dl>
        </div>

        <div className="dashboard-metrics" aria-label="Dashboard metrics">
          <div>
            <strong>{rankedProviders.length}</strong>
            <span>eligible trees</span>
          </div>
          <div>
            <strong>{selectedProvider.distanceLabel}</strong>
            <span>top distance</span>
          </div>
          <div>
            <strong>{averageWait}d</strong>
            <span>avg wait</span>
          </div>
          <div>
            <strong>{averageAccess}</strong>
            <span>avg access</span>
          </div>
        </div>

        <p className="sidebar-note">
          Ranking is location-first: the closest provider trees receive the strongest priority, then symptom relevance,
          access, availability, shade-side manner, and star-provider status refine the order.
        </p>
      </aside>

      <section className="provider-results">
        <header className="results-header">
          <div>
            <div className="eyebrow dark">
              <Search aria-hidden="true" size={15} />
              {symptom} near {originLabel}
            </div>
            <h2>Ranked care canopy</h2>
            <p>
              Primary Care Trees are sorted by practical proximity and ecological specialty, then translated into a
              provider profile you can actually read before your visit.
            </p>
          </div>
          <div className="network-snapshot" aria-label="Network summary">
            <div>
              <strong>{starProviders}</strong>
              <span>star providers</span>
            </div>
            <div>
              <strong>{selectedProvider.clinicNeighborhood}</strong>
              <span>nearest clinic</span>
            </div>
          </div>
        </header>

        <div className="locator-panel" aria-label="Provider locator">
          <div className="locator-map real-map">
            <iframe
              title={`Map showing ${selectedProvider.clinicName}`}
              src={openStreetMapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="map-coordinate-card">
              <MapPin aria-hidden="true" size={16} />
              <span>
                {selectedLatitude.toFixed(4)}, {selectedLongitude.toFixed(4)}
              </span>
            </div>
          </div>
          <div className="locator-copy">
            <span>Selected provider</span>
            <h3>{selectedProvider.clinicName}</h3>
            <address>
              {selectedProvider.clinicAddress}
              <br />
              {selectedProvider.clinicCity}, {selectedProvider.clinicState} {selectedProvider.clinicZipcode}
            </address>
            <p>
              This location-first match starts from {originLabel}, then checks {symptom} against nearby tree-provider
              specialties. The map pin is centered on the provider&apos;s NYC coordinates in{" "}
              {selectedProvider.clinicNeighborhood}.
            </p>
            <div className="map-actions">
              <a href={openStreetMapUrl} target="_blank" rel="noreferrer">
                OpenStreetMap
                <ExternalLink aria-hidden="true" size={15} />
              </a>
              <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                Google Maps
                <ExternalLink aria-hidden="true" size={15} />
              </a>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="provider-list">
            {rankedProviders.map((provider, index) => (
              <article
                key={provider.providerId}
                className={index === 0 ? "provider-card selected" : "provider-card"}
              >
                <div className="provider-card-header">
                  <div>
                    <span className="rank">#{index + 1}</span>
                    <h3>{provider.speciesCommon}</h3>
                    <p>
                      {provider.medicalSpecialty} / {provider.clinicNeighborhood}
                    </p>
                  </div>
                  {provider.starDoctor ? (
                    <div className="star-pill">
                      <Star aria-hidden="true" size={14} />
                      Star
                    </div>
                  ) : null}
                </div>
                <div className="match-row">
                  <strong>{provider.locationMatchLabel}</strong>
                  <span>{provider.distanceLabel}</span>
                </div>
                <div className="card-stats">
                  <span>{provider.careRating.toFixed(1)} rating</span>
                  <span>{provider.nextAvailableVisitDays}d wait</span>
                  <span>{provider.careAccessibilityScore} access</span>
                  <span>{provider.distanceLabel}</span>
                </div>
                <p>{provider.providerBio}</p>
                <div className="condition-chips">
                  {provider.searchableConditions.slice(0, 3).map((condition) => (
                    <span key={condition}>{condition}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <article className="provider-detail">
            <div className="detail-hero">
              <div className="detail-label-row">
                <span>{providerNumber}</span>
                <span>{selectedProvider.popularityBadge}</span>
              </div>
              <h2>
                {selectedProvider.speciesCommon} primary care tree
              </h2>
              <p>
                {selectedProvider.speciesScientific}. {selectedProvider.specialtyDescription}
              </p>
            </div>

            <div className="detail-stats">
              <div>
                <HeartPulse aria-hidden="true" size={18} />
                <strong>{selectedProvider.medicalSpecialty}</strong>
                <span>{selectedProvider.providerType}</span>
              </div>
              <div>
                <CalendarDays aria-hidden="true" size={18} />
                <strong>{selectedProvider.nextAvailableVisitDays} days</strong>
                <span>Next available visit</span>
              </div>
              <div>
                <Navigation aria-hidden="true" size={18} />
                <strong>{selectedProvider.clinicZipcode}</strong>
                <span>{selectedProvider.clinicNeighborhood}</span>
              </div>
              <div>
                <ShieldCheck aria-hidden="true" size={18} />
                <strong>{selectedProvider.stormResponseReadiness}</strong>
                <span>Storm readiness</span>
              </div>
            </div>

            <div className="chart-strip" aria-label="Provider vitals">
              <div>
                <span>Years in practice</span>
                <strong>{selectedProvider.yearsOfPractice}</strong>
              </div>
              <div>
                <span>Years at curb</span>
                <strong>{selectedProvider.yearsAtCurrentSpot}</strong>
              </div>
              <div>
                <span>Shade-side manner</span>
                <strong>{selectedProvider.shadeSideMannerScore.toFixed(1)}</strong>
              </div>
              <div>
                <span>Reviews</span>
                <strong>{selectedProvider.reviewCount}</strong>
              </div>
            </div>

            <div className="detail-section condition-section">
              <div>
                <h3>Condition fit</h3>
                <p>
                  The intake matched {symptom} against this provider&apos;s searchable conditions and care service list.
                </p>
              </div>
              <div className="service-tags">
                {topConditionTags.map((condition) => (
                  <span key={condition}>{condition}</span>
                ))}
              </div>
            </div>

            <div className="detail-section care-plan">
              <h3>Visit plan</h3>
              <ol>
                <li>
                  <FileText aria-hidden="true" size={18} />
                  <span>
                    Intake reviews your ZIP, stated symptom, sidewalk access, and whether the tree has weekend shade.
                  </span>
                </li>
                <li>
                  <Trees aria-hidden="true" size={18} />
                  <span>
                    In-person care happens at the curb: sit, observe light, temperature, noise, and the provider&apos;s
                    canopy behavior.
                  </span>
                </li>
                <li>
                  <Sparkles aria-hidden="true" size={18} />
                  <span>
                    Follow-up guidance turns the visit into a small ritual you can repeat before symptoms escalate.
                  </span>
                </li>
              </ol>
            </div>

            <div className="detail-section services-section">
              <h3>Services for {symptom}</h3>
              <div className="service-tags">
                {selectedProvider.primaryCareServices.map((service) => (
                  <span key={service}>{service}</span>
                ))}
              </div>
            </div>

            <div className="prescription-box">
              <span>Signature prescription</span>
              <p>{selectedProvider.signaturePrescription}</p>
            </div>

            <div className="detail-section">
              <h3>Care profile</h3>
              <p>{selectedProvider.carePhilosophy}</p>
              <ul>
                <li>{selectedProvider.treeExperienceLevel}</li>
                <li>{selectedProvider.weekendAvailability ? "Weekend shade available" : "Weekday shade schedule"}</li>
                <li>{selectedProvider.officeVibe}</li>
                <li>{selectedProvider.waitingRoomFeature}</li>
              </ul>
            </div>

            <div className="detail-section location-section">
              <h3>Clinic location</h3>
              <p>
                {selectedProvider.clinicAddress}, {selectedProvider.clinicCity}, {selectedProvider.clinicState}{" "}
                {selectedProvider.clinicZipcode}
              </p>
              <p>{selectedProvider.clinicDescription}</p>
              <div className="location-meta">
                <span>{selectedProvider.clinicNeighborhood}</span>
                <span>
                  {selectedLatitude.toFixed(5)}, {selectedLongitude.toFixed(5)}
                </span>
              </div>
            </div>

            <div className="visit-rules">
              <span>Appointment notes</span>
              <p>
                Please arrive hydrated. No saws, pruning shears, or unauthorized &quot;second opinions&quot; from lumber are
                permitted during provider visits.
              </p>
            </div>

            <blockquote className="review-box">{selectedProvider.patientReviewSummary}</blockquote>
          </article>
        </div>
      </section>
    </main>
  );
}
