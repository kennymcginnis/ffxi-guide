-- BRD support-first GearSwap scaffold for the FFXI Progression Command Center.
-- Copy to Windower/addons/GearSwap/data/<character>/BRD.lua, then replace every
-- example with gear you own. Use //gs export for exact augmented-item syntax.

function get_sets()
    resist_mode = false

    sets.idle = {
        neck="Loricate Torque +1",
        left_ring="Defending Ring",
        waist="Flume Belt +1"
    }

    sets.precast = {}
    sets.precast.FC = {
        body="Inyanga Jubbah +2",
        legs="Aya. Cosciales +2",
        left_ring="Kishar Ring",
        left_ear="Etiolation Earring"
    }
    sets.precast.Song = set_combine(sets.precast.FC, {
        head="Fili Calot +1",
        waist="Embla Sash",
        back="Intarabus's Cape"
    })

    sets.midcast = {}
    sets.midcast.Song = {
        main="Kali",
        sub="Ammurapi Shield",
        range="Eminent Flute",
        body="Fili Hongreline +1",
        legs="Inyanga Shalwar +2",
        feet="Brioso Slippers +1",
        neck="Moonbow Whistle",
        back="Intarabus's Cape"
    }

    -- The extra-song instrument creates a slot. Use this only for dummy songs;
    -- real songs should finish in your best potency/duration instrument.
    sets.midcast.Dummy = set_combine(sets.midcast.Song, {
        range="Terpander"
    })

    sets.midcast.Minne = set_combine(sets.midcast.Song, {})
    sets.midcast.Minuet = set_combine(sets.midcast.Song, {
        body="Fili Hongreline +1"
    })
    sets.midcast.Madrigal = set_combine(sets.midcast.Song, {
        head="Fili Calot +1"
    })
    sets.midcast.March = set_combine(sets.midcast.Song, {
        hands="Fili Manchettes +1"
    })
    sets.midcast.Scherzo = set_combine(sets.midcast.Song, {
        feet="Fili Cothurnes +1"
    })
    sets.midcast.Carol = set_combine(sets.midcast.Song, {})
    sets.midcast.Ballad = set_combine(sets.midcast.Song, {
        legs="Fili Rhingrave +1"
    })

    sets.midcast.Debuff = set_combine(sets.midcast.Song, {
        range="Linos",
        hands="Brioso Cuffs +1",
        left_ear="Dignitary's Earring",
        left_ring="Stikini Ring +1",
        right_ring="Metamor. Ring +1",
        waist="Acuity Belt +1"
    })
    sets.midcast.Lullaby = set_combine(sets.midcast.Debuff, {
        head="Brioso Roundlet +1"
    })
    sets.midcast.Lullaby.Resistant = set_combine(sets.midcast.Lullaby, {
        -- Replace with your highest-skill / highest-magic-accuracy options.
        neck="Incanter's Torque",
        waist="Porous Rope"
    })

    sets.JA = {}
    sets.JA.Nightingale = {feet="Bihu Slippers +1"}
    sets.JA.Troubadour = {body="Bihu Jstcorps. +1"}
    sets.JA['Soul Voice'] = {legs="Bihu Cannions +1"}

    dummy_songs = S{
        "Army's Paeon",
        "Army's Paeon II",
        "Herb Pastoral",
        "Shining Fantasia",
        "Goblin Gavotte",
        "Fowl Aubade"
    }
end

function precast(spell)
    if spell.type == 'BardSong' then
        equip(sets.precast.Song)
    elseif spell.action_type == 'Magic' then
        equip(sets.precast.FC)
    elseif spell.type == 'JobAbility' and sets.JA[spell.english] then
        equip(sets.JA[spell.english])
    end
end

function midcast(spell)
    if spell.type ~= 'BardSong' then
        return
    end

    if dummy_songs:contains(spell.english) then
        equip(sets.midcast.Dummy)
    elseif spell.english:contains('Lullaby') then
        if resist_mode then
            equip(sets.midcast.Lullaby.Resistant)
        else
            equip(sets.midcast.Lullaby)
        end
    elseif spell.target.type == 'MONSTER' then
        equip(sets.midcast.Debuff)
    else
        equip(song_family_set(spell.english))
    end
end

function aftercast(spell)
    equip(sets.idle)
end

function self_command(command)
    if command == 'toggle resist' then
        resist_mode = not resist_mode
        add_to_chat(122, 'BRD resistant-Lullaby mode: '..tostring(resist_mode))
    end
end

function song_family_set(name)
    if name:contains('Ballad') then return sets.midcast.Ballad end
    if name:contains('Minne') then return sets.midcast.Minne end
    if name:contains('Minuet') then return sets.midcast.Minuet end
    if name:contains('Madrigal') then return sets.midcast.Madrigal end
    if name:contains('March') then return sets.midcast.March end
    if name:contains('Scherzo') then return sets.midcast.Scherzo end
    if name:contains('Carol') then return sets.midcast.Carol end
    return sets.midcast.Song
end
