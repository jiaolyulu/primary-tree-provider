# PCT Marketing Page Audit

## Pangram v2 Reference

- **Hero**: Pangram uses a concise product claim, small proof badges, and an immediately usable demo surface instead of a generic marketing splash.
- **Proof and trust**: The page quickly moves into credibility signals: accuracy claims, customer names, testimonials, and third-party validation.
- **Narrative order**: Sections answer in a clean sequence: what it is, why it matters, how it works, why it is different, what users say, then FAQ.
- **Interaction**: The v2 hero centers a usable input experience, making the landing page feel like product, not brochure.
- **Tone**: Copy is direct, confident, and slightly playful without diluting the technical claim.

## PCT Translation

- Lead with **"Find your Primary Care Tree"** as the literal offer.
- Keep the demo in the first viewport: ZIP code, symptom, and one action, **Find a PCT**.
- Recast Pangram's proof language around the data system: NYC Open Data, 96,950 living tree providers, 30 specialties, 183 ZIP codes.
- Make the dashboard feel clinical enough to be legible, but visibly ecological: rankings, ratings, wait days, access scores, specialty, conditions, location, and provider bio.
- Avoid fake human-doctor fields. The codebook explicitly states that the provider is the actual tree, so the UI should not invent human names, insurance, medical schools, hospital affiliations, telehealth, or referrals.

## Dashboard Field Requirements

The dashboard should expose the fields that matter most for finding and evaluating a PCT:

- Matching inputs: `clinic_zipcode`, `searchable_conditions`, `medical_specialty`
- Identity: `provider_id`, `species_common`, `species_scientific`, `clinic_name`
- Fit and quality: `care_rating`, `review_count`, `star_doctor`, `popularity_badge`, `next_available_visit_days`
- Access: `clinic_address`, `clinic_neighborhood`, `clinic_city`, `clinic_latitude`, `clinic_longitude`, `weekend_availability`, `care_accessibility_score`
- Profile depth: `provider_type`, `tree_experience_level`, `years_of_practice`, `care_philosophy`, `provider_bio`, `primary_care_services`, `signature_prescription`, `patient_review_summary`

## First-Pass Structure

1. Hero with intake demo and civic-health proof metrics.
2. About Us explaining trees as an existing care infrastructure.
3. How It Works as a numbered, procedure-like system.
4. Testimonial section written from the installation visitor perspective.
5. FAQ with practical questions about data, matching, and whether this is medical advice.
6. Dashboard route that ranks sample providers by ZIP proximity and symptom relevance.
