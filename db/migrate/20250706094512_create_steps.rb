class CreateSteps < ActiveRecord::Migration[8.0]
  def change
    create_table :steps do |t|
      t.integer :step_number
      t.string :puzzle_type
      t.text :clue
      t.string :answer_sting
      t.string :media_url

      t.timestamps
    end
  end
end
