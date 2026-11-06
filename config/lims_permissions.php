<?php

return [
    'permissions' => [
        'dashboard.view' => ['label' => 'Voir le tableau de bord', 'group' => 'Activité'],
        'patients.manage' => ['label' => 'Gérer les patients', 'group' => 'Laboratoire'],
        'orders.manage' => ['label' => 'Gérer les dossiers d’analyses', 'group' => 'Laboratoire'],
        'collection.manage' => ['label' => 'Gérer les prélèvements', 'group' => 'Laboratoire'],
        'results.manage' => ['label' => 'Saisir et publier les résultats', 'group' => 'Laboratoire'],
        'invoices.manage' => ['label' => 'Gérer les factures et règlements', 'group' => 'Laboratoire'],
        'catalog.manage' => ['label' => 'Gérer les tests, groupes et catégories', 'group' => 'Gestion'],
        'inventory.manage' => ['label' => 'Gérer les stocks', 'group' => 'Gestion'],
        'staff.manage' => ['label' => 'Gérer les utilisateurs et permissions', 'group' => 'Administration'],
        'email.send' => ['label' => 'Envoyer des messages', 'group' => 'Administration'],
        'settings.manage' => ['label' => 'Gérer les paramètres du laboratoire', 'group' => 'Administration'],
    ],

    'roles' => [
        'administrator' => [
            'name' => 'Administrateur',
            'description' => 'Accès complet, y compris utilisateurs et paramètres.',
            'permissions' => ['*'],
        ],
        'laboratory' => [
            'name' => 'Technicien de laboratoire',
            'description' => 'Dossiers, prélèvements, résultats et consultation des patients.',
            'permissions' => [
                'dashboard.view', 'patients.manage', 'orders.manage',
                'collection.manage', 'results.manage', 'inventory.manage',
            ],
        ],
        'reception' => [
            'name' => 'Accueil / Réception',
            'description' => 'Patients, dossiers, factures et prélèvements.',
            'permissions' => [
                'dashboard.view', 'patients.manage', 'orders.manage',
                'collection.manage', 'invoices.manage',
            ],
        ],
    ],
];
