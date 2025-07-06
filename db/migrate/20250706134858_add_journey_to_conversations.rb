class AddJourneyToConversations < ActiveRecord::Migration[8.0]
  def change
    add_reference :conversations, :journey, null: false, foreign_key: true
  end
end
