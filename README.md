# jp-radish-npm

## Who? What?? Why???

Julius Pokorny was a 20th-c. Hungarian historical linguist, an expert on Indo-European ("Indo-Germanische" in deutsche) languages, and apparently _the_ expert on Old Irish.

Pokorny's mid-20th c. published reference works of reconstructed Indo-European root words were an authoritative summation of more than a century of effort by all linguists. Although supplanted by more current works since, and lacking lots of Hittite material etc., Pokorny's work is awesome.

There are multiple electronic public domain versions of Pokorny's thousand-page Indo-Germanische Etymologische Worterbuch (IEW) on the web, but none that are quite satisfying for hunting down roots as a paper copy would be.

This experimental app let's me enter "root=related-word" pairs and try to link to Pokorny roots, or add Indo-European language lines of prose etc., along with attempts to translate, and again try to link to Pokorny roots. I have another WiPunder jp-radish, for basic browsing of Pokorny roots, that simply indexes all the Pokorny roots for different methods of browsing. 

## How to deploy

TODO
(Git hook post-commit: git --work-tree=blahwww --git-dir=gitblah checkout -f)

## Tech

### CouchDB

A single-page version of the IEW was parsed into 2000+ individual records in a json document, one record per lemma or word root, with page number, root (e.g. /abhro*/), and content fields. These were loaded into a CouchDB document database. A dump of that is found in another, jp-radish repo.

### PouchDB

A key tool/ecosystem for exploring progressive, offline-first approaches to web apps. 

### React

Of course -- see framework provided details below

## PokornyX Screenshot

![wordhus-3001_victory](https://user-images.githubusercontent.com/1759117/35420005-5f70c89c-01f8-11e8-8b1c-47d2a8755af8.png)

## React Frameworks Details

### This REACT project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

See the latest readme on the create-react-app project [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).
