# Requirements Document

## Introduction

The AI-powered gift journey platform (Surprizen) is a comprehensive solution
that helps gift-givers create meaningful, personalized surprise experiences for
recipients. The platform uses local LLM technology (Gemma 3n) to provide
private, conversational guidance through a dual-chatbot flow that transforms
gift ideas into structured surprise journeys with puzzle-based reveals. The
system handles everything from initial vision creation to final gift delivery
and recipient feedback collection.

## Requirements

### Requirement 1

**User Story:** As a gift-giver, I want to authenticate securely and maintain my
session, so that I can access the platform reliably and my progress is
preserved.

#### Acceptance Criteria

1. WHEN a user chooses to log in THEN the system SHALL provide Firebase-UI email
   and social OAuth options
2. WHEN a user successfully authenticates THEN the system SHALL complete login
   within 3 seconds
3. WHEN a user logs in THEN the system SHALL maintain their session for 30 days
4. WHEN a user returns within 30 days THEN the system SHALL automatically
   restore their authenticated session

### Requirement 2

**User Story:** As a gift-giver, I want to interact with an AI chatbot to define
my gift vision, so that I can easily communicate my intentions and preferences
through natural conversation.

#### Acceptance Criteria

1. WHEN a user starts the vision creation process THEN the system SHALL present
   a conversational interface with typing and speech-to-text capabilities
2. WHEN the chatbot asks questions THEN the system SHALL provide quick-reply
   chips for common responses
3. WHEN user preferences are gathered THEN the system SHALL maintain a live
   "profile card" in a side panel showing collected information
4. WHEN the vision chatbot completes its flow THEN the system SHALL have
   captured occasion, budget, recipient interests, desired tone, gift type
   preferences, and schedule
5. WHEN users complete the onboarding experience THEN the system SHALL achieve
   ≥85% customer satisfaction score

### Requirement 3

**User Story:** As a gift-giver, I want to collaborate with an AI to develop a
surprise strategy, so that I can transform my vision into a concrete plan with
appropriate difficulty and delivery methods.

#### Acceptance Criteria

1. WHEN the vision profile is complete THEN the system SHALL present a second
   strategy chatbot
2. WHEN the strategy chatbot engages THEN the system SHALL collaborate to define
   number and type of puzzle steps
3. WHEN strategy is being developed THEN the system SHALL allow selection of
   distribution channels (email, SMS, physical)
4. WHEN strategy planning occurs THEN the system SHALL enable difficulty level
   selection
5. WHEN strategy is finalized THEN the system SHALL provide an initial gift
   shortlist
6. WHEN the giver reviews strategy options THEN the system SHALL allow iteration
   until satisfaction

### Requirement 4

**User Story:** As a gift-giver, I want the AI to generate a visual storyboard
of my surprise journey, so that I can see and modify the complete experience
before committing.

#### Acceptance Criteria

1. WHEN the strategy is agreed upon THEN the system SHALL generate a 3-to-5 step
   puzzle arc using local Gemma processing
2. WHEN the storyboard is created THEN the system SHALL provide two gift options
3. WHEN the storyboard is displayed THEN the system SHALL show an editable
   interface with drag-and-drop re-ordering
4. WHEN JSON is generated for the journey THEN the system SHALL ensure >99% JSON
   validity
5. WHEN storyboard generation occurs THEN the system SHALL complete processing
   locally without cloud round-trips

### Requirement 5

**User Story:** As a gift-giver, I want to review my journey details, reorder
steps if needed, and complete payment, so that I can finalize my surprise and
initiate delivery.

#### Acceptance Criteria

1. WHEN the giver reviews the final journey THEN the system SHALL allow copy
   tweaks and budget approval
2. WHEN the giver wants to modify the journey THEN the system SHALL allow
   reordering of journey steps
3. WHEN payment is initiated THEN the system SHALL use embedded Stripe checkout
4. WHEN payment processing occurs THEN the system SHALL split service fee from
   gift cost transparently
5. WHEN payment succeeds THEN the system SHALL update journey status to "paid"
6. WHEN payment is complete THEN the system SHALL spawn a tracking dashboard

### Requirement 6

**User Story:** As a gift-giver, I want the system to automatically launch and
manage my surprise journey, so that the recipient receives clues at the right
time without my manual intervention.

#### Acceptance Criteria

1. WHEN payment is confirmed THEN the system SHALL trigger Cloud Run Rails API
   via Firebase Hosting
2. WHEN the scheduled time arrives THEN the system SHALL send the first clue via
   email/SMS
3. WHEN each clue is solved THEN the system SHALL store progress in Supabase
4. WHEN subsequent hints are needed THEN the system SHALL use Gemma to re-rank
   them client-side
5. WHEN the journey reaches completion THEN the system SHALL provide
   checkout-to-launch within 15 minutes for the entire flow

### Requirement 7

**User Story:** As a gift-giver, I want real-time tracking of my surprise
journey progress, so that I can monitor the recipient's engagement and know when
each step is completed.

#### Acceptance Criteria

1. WHEN journey progress updates occur THEN the system SHALL use WebSocket
   connections to update the giver dashboard
2. WHEN progress changes happen THEN the system SHALL reflect updates with ≤2
   seconds lag
3. WHEN the giver accesses their dashboard THEN the system SHALL show current
   step status and completion times
4. WHEN journey milestones are reached THEN the system SHALL notify the giver
   appropriately

### Requirement 8

**User Story:** As a gift-giver, I want the system to handle gift fulfillment
automatically, so that physical or digital gifts are delivered without my manual
coordination.

#### Acceptance Criteria

1. WHEN a journey includes physical gifts THEN the system SHALL book delivery
   through Cloud Run job processing
2. WHEN a journey includes digital gifts THEN the system SHALL issue digital
   vouchers automatically
3. WHEN gift fulfillment occurs THEN the system SHALL store proof-of-shipment
   URI in Supabase
4. WHEN fulfillment is complete THEN the system SHALL update tracking status
   accordingly

### Requirement 9

**User Story:** As a gift-giver, I want the final reveal to be memorable and
collect recipient feedback, so that I can measure the success of my surprise and
improve future experiences.

#### Acceptance Criteria

1. WHEN the final puzzle is solved THEN the system SHALL display the gift reveal
   with confetti animation
2. WHEN the reveal occurs THEN the system SHALL prompt the recipient to send a
   video thank-you
3. WHEN the experience concludes THEN the system SHALL collect Net Delight Score
   (NDS) survey responses
4. WHEN feedback is gathered THEN the system SHALL target ≥75/100 NDS within 24
   hours of reveal
5. WHEN analytics are needed THEN the system SHALL log completion time and gift
   ratings for weekly CSV export

### Requirement 10

**User Story:** As a user, I want the platform to run efficiently with local AI
processing, so that my personal data stays private and the experience is fast
and responsive.

#### Acceptance Criteria

1. WHEN the platform loads THEN the system SHALL download and cache Gemma 3n
   (~1.3GB 4-bit) in browser
2. WHEN WebGPU is unsupported THEN the system SHALL fallback to server
   processing
3. WHEN model loading occurs THEN the system SHALL complete load ≤15 seconds on
   95% of devices
4. WHEN preference data is processed THEN the system SHALL keep all data on
   device with only redacted embeddings sent server-side
5. WHEN end-to-end processing occurs THEN the system SHALL achieve
   time-to-first-happy-wow ≤5 minutes for digital-only gifts

### Requirement 11

**User Story:** As a user with accessibility needs, I want the platform to be
fully accessible, so that I can use all features regardless of my abilities.

#### Acceptance Criteria

1. WHEN the platform is accessed THEN the system SHALL comply with WCAG 2.2 AA
   standards
2. WHEN keyboard navigation is used THEN the system SHALL support full chatbot
   interaction via keyboard
3. WHEN screen readers are used THEN the system SHALL provide appropriate screen
   reader support
4. WHEN accessibility features are needed THEN the system SHALL maintain
   usability across all core functions

### Requirement 12

**User Story:** As a platform operator, I want the system to scale automatically
and maintain high availability, so that user demand can be met without service
degradation.

#### Acceptance Criteria

1. WHEN traffic increases THEN the system SHALL auto-scale Cloud Run from 0 to N
   instances
2. WHEN static assets are requested THEN the system SHALL serve via Firebase
   Hosting global CDN
3. WHEN 90% of puzzles are attempted THEN the system SHALL enable solving
   without human support
4. WHEN GDPR compliance is required THEN the system SHALL use Supabase EU region
   and maintain DPA compliance
### Requirement 13

**User Story:** As a gift recipient, I want to receive intriguing clues through my preferred channels, so that I can engage with the surprise journey in a convenient way.

#### Acceptance Criteria

1. WHEN a journey is launched THEN the system SHALL deliver clues to recipients via their preferred channel (email, SMS, or physical)
2. WHEN a clue is delivered THEN the system SHALL include clear instructions on how to engage with the puzzle
3. WHEN a recipient receives a clue THEN the system SHALL provide a unique URL to access the digital experience
4. WHEN a recipient accesses a clue THEN the system SHALL not require authentication for basic puzzle solving
5. WHEN a recipient engages with a clue THEN the system SHALL track engagement metrics anonymously

### Requirement 14

**User Story:** As a gift recipient, I want an intuitive interface to solve puzzles, so that I can progress through the journey without frustration.

#### Acceptance Criteria

1. WHEN a recipient accesses a puzzle THEN the system SHALL present a mobile-optimized, intuitive interface
2. WHEN a recipient attempts to solve a puzzle THEN the system SHALL provide clear feedback on correctness
3. WHEN a recipient is stuck THEN the system SHALL offer progressive hints after appropriate time intervals
4. WHEN a recipient solves a puzzle THEN the system SHALL provide immediate positive reinforcement
5. WHEN a puzzle is solved THEN the system SHALL clearly indicate how to proceed to the next step

### Requirement 15

**User Story:** As a gift recipient, I want a memorable final reveal experience, so that the surprise culminates in a delightful moment.

#### Acceptance Criteria

1. WHEN the recipient solves the final puzzle THEN the system SHALL present an animated reveal experience with confetti
2. WHEN the gift is revealed THEN the system SHALL display personalized messaging from the gift-giver
3. WHEN the reveal occurs THEN the system SHALL provide clear instructions for gift redemption (digital) or delivery information (physical)
4. WHEN the experience concludes THEN the system SHALL offer an easy way to record and send a thank-you video
5. WHEN the recipient completes the journey THEN the system SHALL request NDS feedback through a simple, non-intrusive survey

### Requirement 16

**User Story:** As a gift recipient, I want the option to save my preferences for future gifts, so that I can receive more personalized experiences in the future.

#### Acceptance Criteria

1. WHEN a recipient completes a journey THEN the system SHALL offer an optional account creation
2. WHEN a recipient chooses to create an account THEN the system SHALL securely store their preferences
3. WHEN a recipient has an account THEN the system SHALL use their preferences to enhance future gift journeys
4. WHEN preference data is stored THEN the system SHALL comply with privacy requirements and allow easy data deletion