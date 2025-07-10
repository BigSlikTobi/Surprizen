class AddInterestsToJourneys < ActiveRecord::Migration[8.0]
  def change
    add_column :journeys, :interests, :string
  end
end
