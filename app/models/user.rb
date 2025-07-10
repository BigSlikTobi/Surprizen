class User < ApplicationRecord
  has_many :journeys, foreign_key: 'user_id'
  belongs_to :received_journey, class_name: 'Journey', foreign_key: 'journey_id', optional: true
end
