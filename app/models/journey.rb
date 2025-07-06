class Journey < ApplicationRecord
    enum :status, { designing: 0, paid: 1, launched: 2, completed: 3 }
    belongs_to :user
    has_one :journey_user, class_name: 'User', foreign_key: 'journey_id'
    has_one :conversation
end
