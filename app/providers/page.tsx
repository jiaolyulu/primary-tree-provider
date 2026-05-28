import Link from "next/link";
import { ArrowLeft, CalendarDays, HeartPulse, Leaf, MapPin, Navigation, Search, Star } from "lucide-react";
import { IntakeForm } from "@/components/IntakeForm";
import { rankProviders } from "@/lib/providers";

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string; symptom?: string }>;
}) {
  const params = await searchParams;
  const zipcode = params.zip || "11215";
  const symptom = params.symptom || "fall risk";
  const rankedProviders = rankProviders(zipcode, symptom);
  const selectedProvider = rankedProviders[0];

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
        <IntakeForm compact initialZip={zipcode} initialSymptom={symptom} />

        <div className="dashboard-metrics" aria-label="Dashboard metrics">
          <div>
            <strong>{rankedProviders.length}</strong>
            <span>sample matches</span>
          </div>
          <div>
            <strong>{selectedProvider.careRating.toFixed(1)}</strong>
            <span>top rating</span>
          </div>
          <div>
            <strong>{selectedProvider.nextAvailableVisitDays}d</strong>
            <span>next visit</span>
          </div>
          <div>
            <strong>{selectedProvider.careAccessibilityScore}</strong>
            <span>access score</span>
          </div>
        </div>

        <p className="sidebar-note">
          Ranking combines symptom relevance, ZIP proximity, rating, star status, and wait time. This first UI pass uses
          representative records shaped from the PCT codebook.
        </p>
      </aside>

      <section className="provider-results">
        <header className="results-header">
          <div>
            <div className="eyebrow dark">
              <Search aria-hidden="true" size={15} />
              {symptom} near {zipcode}
            </div>
            <h2>Recommended Primary Care Trees</h2>
          </div>
          <div className="map-preview" aria-label="Map preview">
            <span />
            <span />
            <span />
            <MapPin aria-hidden="true" size={18} />
          </div>
        </header>

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
                      {provider.medicalSpecialty} · {provider.clinicNeighborhood}
                    </p>
                  </div>
                  {provider.starDoctor ? (
                    <div className="star-pill">
                      <Star aria-hidden="true" size={14} />
                      Star
                    </div>
                  ) : null}
                </div>
                <div className="card-stats">
                  <span>{provider.careRating.toFixed(1)} rating</span>
                  <span>{provider.nextAvailableVisitDays} day wait</span>
                  <span>{provider.careAccessibilityScore} access</span>
                </div>
                <p>{provider.providerBio}</p>
              </article>
            ))}
          </div>

          <article className="provider-detail">
            <div className="detail-hero">
              <span>{selectedProvider.clinicName}</span>
              <h2>
                {selectedProvider.speciesCommon} #{selectedProvider.providerId}
              </h2>
              <p>{selectedProvider.specialtyDescription}</p>
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
            </div>

            <div className="detail-section">
              <h3>Care Profile</h3>
              <p>{selectedProvider.carePhilosophy}</p>
              <ul>
                <li>{selectedProvider.yearsOfPractice} years of practice</li>
                <li>{selectedProvider.treeExperienceLevel}</li>
                <li>{selectedProvider.weekendAvailability ? "Weekend shade available" : "Weekday shade schedule"}</li>
                <li>Storm response readiness: {selectedProvider.stormResponseReadiness}</li>
              </ul>
            </div>

            <div className="detail-section">
              <h3>Services for "{symptom}"</h3>
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
              <h3>Clinic Location</h3>
              <p>
                {selectedProvider.clinicAddress}, {selectedProvider.clinicCity}, {selectedProvider.clinicState}{" "}
                {selectedProvider.clinicZipcode}
              </p>
              <p>{selectedProvider.clinicDescription}</p>
            </div>

            <blockquote className="review-box">{selectedProvider.patientReviewSummary}</blockquote>
          </article>
        </div>
      </section>
    </main>
  );
}
