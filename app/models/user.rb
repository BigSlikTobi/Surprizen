class User < ApplicationRecord
  has_many :journeys
  belongs_to :journey, optional: true
end
