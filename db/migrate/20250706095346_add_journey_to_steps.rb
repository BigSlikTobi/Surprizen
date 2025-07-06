class AddJourneyToSteps < ActiveRecord::Migration[8.0]
  def change
    add_reference :steps, :journey, null: false, foreign_key: true
  end
end
